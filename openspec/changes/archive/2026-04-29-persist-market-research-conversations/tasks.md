## 1. Backend Data Model

- [x] 1.1 Add Mongoose schemas for agent conversations and agent messages, including userId, conversationId, role, status, date, context, answer, error, timestamps, messageCount, and lastMessageAt fields.
- [x] 1.2 Add indexes for user-scoped conversation listing and message loading, including userId/lastMessageAt and userId/conversationId/createdAt.
- [x] 1.3 Define backend DTOs/types for conversation summaries, conversation detail, messages, and create conversation requests.
- [x] 1.4 Add a stable `copilotSessionId` to conversation records as a future-compatible Copilot SDK session persistence identifier without enabling resume behavior.

## 2. Backend Conversation APIs

- [x] 2.1 Create an agent conversation service with user-scoped create, list, detail, and delete operations.
- [x] 2.2 Create guarded controller routes for `GET /api/agent/conversations`, `POST /api/agent/conversations`, `GET /api/agent/conversations/:id`, and `DELETE /api/agent/conversations/:id`.
- [x] 2.3 Ensure every conversation read/delete validates ownership and does not expose other users' conversation existence.
- [x] 2.4 Generate default conversation titles from the first user question when a conversation has no meaningful title.

## 3. Conversation-Scoped Agent Streaming

- [x] 3.1 Add `POST /api/agent/conversations/:id/messages/stream` guarded by `JwtAuthGuard`.
- [x] 3.2 Persist the user message with question, date, and context before invoking the agent.
- [x] 3.3 Reuse the existing market research agent service for Copilot execution without replaying full conversation history into the prompt.
- [x] 3.4 Persist a completed assistant message when final structured answer validation succeeds.
- [x] 3.5 Persist a failed assistant message when agent execution, tool execution, Copilot calls, or validation ultimately fail.
- [x] 3.6 Update conversation `lastMessageAt` and `messageCount` after user and assistant messages are recorded.
- [x] 3.7 Continue streaming status/tool/final/error events to the client without requiring full progress event persistence.

## 4. Frontend Models and Services

- [x] 4.1 Add Angular models for agent conversation summary, conversation detail, conversation message, and conversation-scoped stream events.
- [x] 4.2 Add an `AgentConversationService` for listing, creating, loading, deleting, and sending conversation-scoped streaming messages.
- [x] 4.3 Ensure fetch-based SSE requests include credentials and preserve existing stream parsing behavior.
- [x] 4.4 Initialize conversation state after auth state is known, loading the most recent conversation when available.

## 5. Research Assistant UI

- [x] 5.1 Refactor `ResearchAssistantComponent` from single-answer state to current conversation/thread state.
- [x] 5.2 Render user messages, completed assistant structured answers, failed assistant states, and per-message date/context metadata.
- [x] 5.3 Add UI actions for new conversation, switching conversations, and deleting the current conversation.
- [x] 5.4 Route submitted questions into the current conversation, creating a conversation first when none exists.
- [x] 5.5 Keep existing auth gate behavior for logged-out users and avoid loading conversation data before login.

## 6. Tests and Verification

- [x] 6.1 Add backend tests for conversation list/create/detail/delete ownership and 401 behavior.
- [x] 6.2 Add backend tests for conversation-scoped streaming success and failure persistence.
- [x] 6.3 Add frontend service tests for conversation APIs and SSE event parsing.
- [x] 6.4 Update research assistant component tests for loading history, submitting a message, failed assistant states, new conversation, and delete behavior.
- [x] 6.5 Run the relevant API and web tests plus typecheck/lint targets for touched projects.
