## Why

FormoAtlas already uses a configured Copilot CLI headless server, but the API services still create and stop a `CopilotClient` inside each Copilot-backed operation. That lifecycle does not match the backend-service shape documented by GitHub Copilot SDK, and the market research conversation model now has stable `copilotSessionId` values that are not used by the runtime.

This change aligns the backend agent architecture with a long-lived shared SDK client, while keeping session isolation explicit per workflow.

## What Changes

- Introduce a shared backend Copilot runtime provider that owns one process-lifetime `CopilotClient` connected through `COPILOT_CLI_URL`.
- Update Copilot-backed workflows to obtain sessions from the shared runtime provider instead of constructing and stopping clients per request.
- Keep barometer analysis and single-turn market research as ephemeral session workflows.
- Use saved conversation `copilotSessionId` values for conversation-scoped market research sessions, so a conversation can create or resume the same Copilot runtime session.
- Add application-level conversation session locking for conversation-scoped agent execution to avoid concurrent writes to the same Copilot session.
- Preserve MongoDB conversation/messages as the product source of truth; Copilot session state is runtime memory, not the canonical transcript.
- Extend deletion behavior so app-owned Copilot session state can be cleaned up when a conversation is deleted.
- Document the operational boundary for a shared CLI server, including network trust, session state persistence, and future horizontal scaling.

## Capabilities

### New Capabilities

- `copilot-runtime-lifecycle`: Shared Copilot SDK client lifecycle, workflow session types, cleanup, and operational limits for the API backend.

### Modified Capabilities

- `market-research-agent`: Market research agent execution uses the shared Copilot runtime provider and distinguishes ephemeral single-turn sessions from conversation-scoped sessions.
- `agent-conversations`: Conversation records use their stored `copilotSessionId` for runtime session creation/resumption, locking, and cleanup.
- `barometer-copilot-analysis`: Barometer Copilot analysis uses the shared runtime provider while retaining ephemeral one-shot session semantics.

## Impact

- Backend: new shared Copilot runtime provider/module, updates to `MarketResearchAgentService`, `AgentConversationController` or service orchestration, and `BarometerService`.
- Data/API behavior: existing endpoint shapes remain compatible; conversation-scoped execution gains runtime session continuity and locking.
- Operations: API process lifecycle now owns Copilot client cleanup; deployments must keep `COPILOT_CLI_URL` reachable and protect the SDK-to-CLI network path.
- Tests: backend unit tests need coverage for singleton runtime usage, missing CLI URL handling, conversation session id usage, lock conflicts/serialization, and cleanup behavior.
