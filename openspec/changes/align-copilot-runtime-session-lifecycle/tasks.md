## 1. Shared Runtime

- [x] 1.1 Add a backend Copilot runtime provider/module that owns one process-lifetime `CopilotClient` configured from `COPILOT_CLI_URL`.
- [x] 1.2 Expose helper methods for ephemeral session creation, named session create/resume, session deletion, model access, and module shutdown cleanup.
- [x] 1.3 Add unit coverage for missing `COPILOT_CLI_URL`, shared client reuse, and `OnModuleDestroy` client cleanup behavior.

## 2. Ephemeral Workflow Migration

- [x] 2.1 Update `BarometerService` to use the shared runtime provider while retaining fresh ephemeral sessions and existing schema validation/retry behavior.
- [x] 2.2 Update single-turn market research endpoints to use the shared runtime provider while retaining fresh ephemeral sessions and existing tool/schema behavior.
- [x] 2.3 Update backend tests that mock `CopilotClient` so they assert provider/session behavior instead of per-request client construction and stop calls.

## 3. Conversation Runtime Sessions

- [x] 3.1 Add a session lock abstraction keyed by `copilotSessionId`, with timeout or rejection behavior for concurrent same-conversation execution.
- [x] 3.2 Update conversation-scoped streaming execution to load the owned conversation's `copilotSessionId` and pass it into agent execution.
- [x] 3.3 Update market research agent execution to create or resume a named Copilot session for conversation-scoped requests and disconnect it after completion or failure.
- [x] 3.4 Add tests proving same-conversation requests are serialized/rejected and different conversation session ids can execute independently.

## 4. Cleanup Semantics

- [x] 4.1 Update conversation deletion to attempt best-effort Copilot session deletion for the conversation's app-owned `copilotSessionId`.
- [x] 4.2 Ensure Copilot session cleanup failure is logged but does not restore or block app-owned conversation/message deletion.
- [x] 4.3 Add tests for successful cleanup and cleanup-failure deletion behavior.

## 5. Verification

- [x] 5.1 Run API unit tests for barometer, market research agent, and agent conversations.
- [x] 5.2 Run targeted lint/typecheck or build verification for the API app.
- [x] 5.3 Manually review that non-Copilot market data APIs remain independent from Copilot runtime failures.
