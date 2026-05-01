## Context

FormoAtlas has two Copilot-backed backend workflows today:

- `BarometerService` generates a structured daily market barometer only on cache miss.
- `MarketResearchAgentService` answers authenticated user research questions, including conversation-scoped streaming requests.

Both services currently create a `CopilotClient` inside the operation and call `client.stop()` in `finally`. The app already requires `COPILOT_CLI_URL`, so the API is connecting to a configured Copilot CLI headless server rather than relying on an SDK-managed local CLI process. Still, the client lifecycle is request-scoped, which is not the right boundary for a backend service.

The product model has also moved beyond pure one-shot interaction. `agent_conversations` already stores an app-owned stable `copilotSessionId`, but runtime execution still creates unnamed fresh sessions and does not resume the stored session.

Current shape:

```text
API request
  -> domain service
  -> new CopilotClient({ cliUrl })
  -> createSession(...)
  -> sendAndWait(...)
  -> session.disconnect()
  -> client.stop()
```

Target shape:

```text
API process
  -> CopilotRuntimeService
       owns one CopilotClient for process lifetime
       stops client during module shutdown

Workflow request
  -> create or resume session through runtime service
  -> sendAndWait(...)
  -> disconnect or delete session according to workflow semantics
```

## Goals / Non-Goals

**Goals:**

- Align FormoAtlas backend usage with Copilot SDK backend service guidance: one shared client connection to the configured CLI server per API process.
- Keep workflow-specific session semantics explicit:
  - barometer analysis remains ephemeral one-shot execution.
  - single-turn market research remains ephemeral one-shot execution.
  - conversation-scoped market research uses the conversation's stored `copilotSessionId`.
- Keep MongoDB conversations/messages as the product source of truth.
- Add application-level serialization for requests writing to the same Copilot conversation session.
- Make Copilot client shutdown part of API process lifecycle, not request lifecycle.
- Preserve existing API endpoint shapes and structured answer validation.

**Non-Goals:**

- Do not merge domain modules into a single agent service.
- Do not replace MongoDB conversation/message history with Copilot session state.
- Do not add multi-user shared collaborative sessions.
- Do not introduce a distributed queue or Redis dependency in the first implementation unless in-process locking proves insufficient for the current deployment.
- Do not redesign prompts, tool allowlists, evidence schema, or frontend assistant UI.
- Do not implement horizontal Copilot CLI high availability in this change; document the boundary for future scaling.

## Decisions

### Decision 1: Add a Shared Copilot Runtime Provider

**Choice:** Add a NestJS provider, tentatively `CopilotRuntimeService`, that lazily or eagerly constructs one `CopilotClient` using `COPILOT_CLI_URL` and `COPILOT_MODEL` accessors. The provider exposes small workflow-oriented helpers instead of leaking lifecycle decisions everywhere.

Conceptual API:

```text
CopilotRuntimeService
  getModel(): string
  createEphemeralSession(config): Promise<CopilotSession>
  createOrResumeSession(sessionId, config): Promise<CopilotSession>
  deleteSession(sessionId): Promise<void>
  onModuleDestroy(): Promise<void> -> client.stop()
```

**Rationale:** The shared client is a cross-cutting infrastructure concern, while session configuration belongs to each workflow. This avoids copying `new CopilotClient(...)` and `client.stop()` across services without flattening domain boundaries.

**Alternatives considered:**

- Keep per-request clients. This is simple but preserves lifecycle churn and keeps the code at odds with backend-service deployment guidance.
- Move all agent logic into one `AgentService`. That would over-couple barometer, market research, and conversation persistence. The real shared concern is the SDK runtime, not the product workflow.

### Decision 2: Keep Ephemeral Sessions for One-Shot Workflows

**Choice:** Barometer analysis and non-conversation market research continue to create fresh sessions, send one prompt plus bounded retry if needed, then disconnect the session.

```text
barometer cache miss
  -> shared client
  -> createSession(no sessionId)
  -> send / retry
  -> disconnect

single-turn research endpoint
  -> shared client
  -> createSession(no sessionId)
  -> send / retry
  -> disconnect
```

**Rationale:** These workflows do not need runtime memory. Fresh sessions avoid stale context and keep outputs controlled by the request payload.

**Alternatives considered:**

- Persist barometer sessions by date. This adds storage and cleanup complexity without improving the cached final result.
- Force every market research endpoint to use conversation ids. That would break the existing single-turn compatibility/testing path.

### Decision 3: Use Stored Copilot Session IDs for Conversation-Scoped Research

**Choice:** Conversation-scoped streaming requests should load the owned conversation, retrieve its stored `copilotSessionId`, and pass it to the agent service. The agent service should create or resume a named session with that id.

```text
POST /agent/conversations/:id/messages/stream
  -> ensure user owns conversation
  -> read copilotSessionId
  -> record user message
  -> with lock(copilotSessionId)
       -> createOrResumeSession(copilotSessionId, market research config)
       -> send prompt / retry
       -> disconnect
  -> record assistant success or failure
```

The app-level MongoDB messages remain canonical. Copilot session history is used only to improve runtime continuity across turns.

**Rationale:** The existing data model intentionally reserved `copilotSessionId`. Using it now gives conversation-scoped behavior a real runtime boundary without changing the product transcript model.

**Alternatives considered:**

- Continue saving `copilotSessionId` without using it. That keeps behavior simple but wastes the prepared model and misses the natural next step for conversations.
- Reconstruct memory by injecting recent MongoDB messages into every prompt. This is controllable and may still be useful later, but it duplicates what persistent Copilot sessions provide and increases token cost immediately.

### Decision 4: Serialize Access Per Conversation Session

**Choice:** Add an application-level lock keyed by `copilotSessionId` for conversation-scoped execution. The first implementation can be in-process if the current deployment runs one API instance. The design should isolate the locking interface so Redis or another distributed lock can replace it later.

```text
CopilotSessionLockService
  withLock(sessionId, timeoutMs, fn)
```

**Rationale:** Copilot SDK documentation notes that concurrent access to the same session is undefined and must be serialized by the app. UI should already prevent double-submit, but the backend must enforce the invariant.

**Alternatives considered:**

- Rely only on frontend disabled state. This fails under retries, multiple tabs, or direct API calls.
- Add Redis immediately. This is the right production direction for multiple API replicas, but it is extra infrastructure if the current deployment is single-process.

### Decision 5: Conversation Delete Cleans Up Runtime Session State Best-Effort

**Choice:** When a user deletes a conversation, the API should delete app-owned messages/conversation records and attempt `deleteSession(copilotSessionId)` through the runtime provider. Copilot cleanup failure should be logged but should not resurrect or block app-level deletion.

**Rationale:** The product deletion contract is about FormoAtlas data ownership. Runtime cleanup should follow that boundary but should not make the app database inconsistent if the CLI server is temporarily unavailable.

**Alternatives considered:**

- Never delete Copilot session state. That leaks runtime history and disk state.
- Make deletion fail if Copilot cleanup fails. That gives stronger cleanup semantics but makes user-facing deletion depend on external runtime availability.

### Decision 6: Document Shared CLI Operational Boundary

**Choice:** This change should document that a shared CLI server is resource-efficient but has operational limits:

- SDK-to-CLI traffic must run on a trusted network path.
- The CLI server is a single point of failure unless deployed with HA patterns.
- Persistent session state depends on writable CLI session storage.
- Horizontal scaling later requires sticky routing or shared session storage plus distributed locking.

**Rationale:** The code can align with a backend-service pattern now, but production reliability depends on deployment choices outside the NestJS services.

**Alternatives considered:**

- Hide deployment concerns in code comments only. That makes future production work harder to reason about.

## Risks / Trade-offs

- **Persistent Copilot sessions may carry stale market context across different dates or pages.** -> Keep each prompt explicit about current date, route, symbol, and mode; MongoDB message context remains canonical for rendering and audit.
- **In-process locks do not protect multiple API replicas.** -> Encapsulate locking behind a service and document Redis/distributed lock as the scaling path.
- **Named session cleanup may fail when the CLI server is unavailable.** -> Treat cleanup as best-effort, log warnings, and keep app-level deletion consistent.
- **Shared client failure affects all Copilot workflows in the API process.** -> Surface service unavailable responses per workflow, keep non-Copilot market data APIs independent, and rely on process restart/health checks for recovery.
- **Copilot SDK is still evolving.** -> Keep the runtime provider narrow so SDK API changes are localized.

## Migration Plan

1. Add the shared runtime provider and wire it into the API module graph.
2. Move `CopilotClient` construction and `client.stop()` out of `BarometerService` and `MarketResearchAgentService`.
3. Preserve current ephemeral session behavior for barometer and single-turn research.
4. Add a session lock abstraction and apply it only to conversation-scoped research execution.
5. Pass owned conversation `copilotSessionId` into conversation-scoped agent execution and create/resume named sessions.
6. Add best-effort Copilot session deletion when conversations are deleted.
7. Update tests around lifecycle, session ids, locking, and cleanup.

Rollback: restore per-operation client construction and stop calls, and leave `copilotSessionId` as stored metadata only. Since endpoint shapes do not change, rollback should not require frontend changes.

## Open Questions

- Is the current deployment guaranteed to run a single API process, or should the first implementation include a distributed lock immediately?
- Should conversation-scoped sessions enable any Copilot infinite-session/compaction options now, or wait until long conversations show context pressure?
- What operational check should verify the configured CLI server is reachable: startup validation, health endpoint, or lazy failure on first Copilot request?
