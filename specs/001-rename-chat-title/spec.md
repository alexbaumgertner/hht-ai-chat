# Feature Specification: Rename Chat Title

**Feature Branch**: `001-rename-chat-title`

**Created**: 2026-08-03

**Status**: Implemented

**Input**: User description: "Patients can rename their own chat conversation titles from the chat UI so threads stay organized without reopening admin."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Rename open conversation (Priority: P1)

A signed-in patient opens an existing conversation and renames its title so the
sidebar (and future visits) show a meaningful name instead of the auto-generated
title from the first message.

**Why this priority**: Primary value of the feature; without this, rename is
unavailable where patients spend time.

**Independent Test**: Patient opens `/chat/[id]`, edits title, saves, refreshes;
title remains. Sidebar list shows the new title.

**Acceptance Scenarios**:

1. **Given** an authenticated patient viewing a chat they own, **When** they set
   a non-empty title of up to 120 characters and save, **Then** the chat title
   updates in the panel header and thread list without re-authentication.
2. **Given** a successful rename, **When** the patient reloads the page or
   revisits the thread, **Then** the new title is shown.
3. **Given** an authenticated patient viewing a chat they own, **When** they
   submit a blank or whitespace-only title, **Then** the system rejects the
   change with a clear validation error and keeps the previous title.

---

### User Story 2 - Cannot rename others' chats (Priority: P2)

A patient must not rename or inspect rename outcomes for conversations they do
not own.

**Why this priority**: Constitution principle II (ownership access control).

**Independent Test**: API rename against another patient's chat returns
403/404; own chats still work.

**Acceptance Scenarios**:

1. **Given** patient A and patient B with separate chats, **When** A attempts to
   rename B's chat by id, **Then** the API denies the request and B's title is
   unchanged.
2. **Given** an unauthenticated request, **When** rename is attempted, **Then**
   the API responds 401.

---

### Edge Cases

- Title longer than 120 characters after trim is rejected (or truncated only if
  product policy says so — **reject** with clear error).
- Concurrent renames: last successful write wins; UI shows server-returned title.
- Archived chats: rename remains allowed for owners (status field unrelated).
- Special characters and multi-language text are allowed (Unicode), no HTML rendering of title as markup.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow an authenticated patient to update the title of
  a chat they own via a patient-facing API.
- **FR-002**: System MUST reject empty or whitespace-only titles.
- **FR-003**: System MUST reject titles longer than 120 characters after trim.
- **FR-004**: System MUST deny rename of chats the requester does not own.
- **FR-005**: Patient UI MUST provide a control on the open conversation view
  to edit and save the title (inline edit or equivalent).
- **FR-006**: After successful rename, thread list and open chat title MUST
  reflect the new title without requiring full logout.
- **FR-007**: Rename MUST NOT expose AI settings, API keys, or other chats'
  messages.

### Key Entities

- **Chat**: Owned conversation with `title`, `user`, `status`, messages join.
- **Patient user**: Authenticated role `patient` performing the rename.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A patient can rename a conversation and verify the new title
  within 30 seconds without admin intervention.
- **SC-002**: 100% of cross-owner rename attempts fail in automated access tests
  without mutating the target document.
- **SC-003**: Invalid titles (empty / over-long) never persist; user sees an
  error message.

## Assumptions

- Existing Payload `chats` collection and ownership access already allow owner
  update of non-snapshot fields.
- Titles are single-line display strings (not rich text).
- No audit log of renames required for this iteration.
- Admins may continue to edit titles in Payload admin; out of UI scope for this
  feature but access remains unchanged.

## Clarifications

### Session 2026-08-03

- Q: Max title length? → A: 120 characters after trim.
- Q: Rename on archived chats? → A: Allowed for owner.
- Q: Sidebar-only rename vs open chat? → A: Open chat view is required (P1);
  sidebar optional later.
