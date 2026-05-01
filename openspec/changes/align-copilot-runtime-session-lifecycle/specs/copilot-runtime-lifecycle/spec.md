## ADDED Requirements

### Requirement: Shared Copilot Client Lifecycle
The API backend SHALL manage GitHub Copilot SDK client lifecycle as a process-level runtime concern. The backend SHALL connect to the configured Copilot CLI headless server through a shared `CopilotClient` instead of creating and stopping a client for each Copilot-backed request.

#### Scenario: API process initializes Copilot runtime
- **WHEN** the API process needs to run a Copilot-backed workflow and `COPILOT_CLI_URL` is configured
- **THEN** the system SHALL use a shared Copilot SDK client configured with that CLI URL

#### Scenario: Multiple workflows use Copilot
- **WHEN** barometer analysis and market research agent execution both need Copilot during the same API process lifetime
- **THEN** both workflows SHALL obtain sessions through the shared Copilot runtime rather than constructing independent request-scoped clients

#### Scenario: API process shuts down
- **WHEN** the API process or Copilot runtime module is destroyed
- **THEN** the system SHALL stop the shared Copilot SDK client and log cleanup failures without throwing user-facing request errors during shutdown

#### Scenario: Missing CLI URL
- **WHEN** a Copilot-backed workflow is requested but `COPILOT_CLI_URL` is not configured
- **THEN** the system SHALL fail that workflow with a service unavailable response
- **AND** the system MUST NOT attempt to create a Copilot session

### Requirement: Workflow Session Lifecycle
The API backend SHALL treat Copilot sessions as workflow-scoped resources. Ephemeral workflows SHALL use fresh unnamed sessions, while conversation workflows SHALL use app-owned stable session identifiers.

#### Scenario: Ephemeral one-shot workflow
- **WHEN** a barometer analysis or single-turn market research request creates a Copilot session
- **THEN** the system SHALL create a fresh Copilot session without a conversation-owned `sessionId`
- **AND** the system SHALL disconnect that session after completion or failure

#### Scenario: Conversation workflow
- **WHEN** a conversation-scoped market research request creates or resumes a Copilot session
- **THEN** the system SHALL use the conversation record's app-owned `copilotSessionId`
- **AND** the system SHALL disconnect the session after completion or failure while preserving resumable session state

#### Scenario: Runtime session state is not product history
- **WHEN** Copilot session state exists for a conversation
- **THEN** MongoDB conversation and message records SHALL remain the canonical product transcript
- **AND** Copilot session state SHALL be treated as runtime memory only

### Requirement: Shared CLI Operational Boundary
The backend SHALL keep the Copilot CLI headless server as an explicitly configured external runtime dependency with documented operational boundaries.

#### Scenario: SDK-to-CLI network path
- **WHEN** the API connects to `COPILOT_CLI_URL`
- **THEN** deployments SHALL secure that network path as trusted infrastructure
- **AND** the application MUST NOT expose direct client control of Copilot CLI URLs or session identifiers

#### Scenario: Future horizontal scaling
- **WHEN** the API is deployed with multiple API replicas or multiple Copilot CLI servers
- **THEN** the system SHALL require sticky routing or shared Copilot session storage plus distributed locking before relying on conversation session resumption across replicas
