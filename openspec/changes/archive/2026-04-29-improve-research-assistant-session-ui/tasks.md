## 1. View State And Loading Flow

- [x] 1.1 Add explicit list/session view state to `ResearchAssistantComponent`.
- [x] 1.2 Change drawer open behavior so logged-in users load conversation summaries and remain on list view.
- [x] 1.3 Update conversation selection to load detail and switch to session view.
- [x] 1.4 Update new conversation flow to create, load detail, and switch to session view.
- [x] 1.5 Update delete flow so deleting the current conversation returns to list view or an empty list state.

## 2. List View UI

- [x] 2.1 Split the template into logged-in list view and session view branches.
- [x] 2.2 Render conversation summary rows with title, message count, last message time, and available context/date hint.
- [x] 2.3 Add list empty state with a clear new-conversation action.
- [x] 2.4 Preserve the logged-out auth gate without loading conversation data.

## 3. Session View UI

- [x] 3.1 Add session header with back-to-list control, current conversation title, and close/delete actions.
- [x] 3.2 Move message history rendering into the session view thread area.
- [x] 3.3 Keep follow-up question buttons wired to set and submit the selected prompt in the current session.
- [x] 3.4 Ensure submit flow stays in session view during loading, final completion, and recoverable errors.

## 4. Bottom Composer And Progress

- [x] 4.1 Move the question composer to the bottom of session view.
- [x] 4.2 Add a single research-mode affordance to the composer without changing the request payload.
- [x] 4.3 Reposition loading/progress/error UI so it remains associated with the active session and does not push the composer away from the bottom.
- [x] 4.4 Update responsive styles so the drawer uses a stable flex layout on desktop and mobile.

## 5. Tests And Verification

- [x] 5.1 Update component tests for initial list view loading behavior.
- [x] 5.2 Add tests for selecting a conversation and returning to list view.
- [x] 5.3 Add tests for new conversation entering session view.
- [x] 5.4 Add tests for submit behavior staying in the active session.
- [x] 5.5 Add tests for logged-out users not loading conversation data.
- [x] 5.6 Run relevant web tests for the research assistant component.

## 6. Composer Redesign Follow-up

- [x] 6.1 Update composer markup so the textarea is full-width and actions sit below it.
- [x] 6.2 Adjust composer styles to provide a larger default input area with bounded growth.
- [x] 6.3 Keep the single research-mode affordance and submit behavior unchanged.
- [x] 6.4 Verify the redesigned composer with focused component tests and web build.
