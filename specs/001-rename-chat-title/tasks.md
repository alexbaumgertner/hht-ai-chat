# Tasks: Rename Chat Title

**Input**: Design documents from `/specs/001-rename-chat-title/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [x] T001 Confirm feature branch and Spec Kit artifacts under `specs/001-rename-chat-title/`

## Phase 2: Foundational

- [x] T002 Add shared chat title validation helper in `src/lib/chats/title.ts` (trim, non-empty, max 120)
- [x] T003 [P] Add Vitest coverage for title validation in `tests/int/chat-title.int.spec.ts`

## Phase 3: User Story 1 - Rename open conversation (Priority: P1) 🎯 MVP

**Goal**: Patient renames own chat from open conversation UI

**Independent Test**: PATCH own chat id + UI save → title persisted

- [x] T004 [US1] Implement `PATCH` on `src/app/api/chats/[id]/route.ts` per `contracts/chats-patch.md`
- [x] T005 [US1] Extend `ChatPanel` in `src/components/chat/ChatPanel.tsx` with optional rename UX
- [x] T006 [US1] Wire rename in `src/app/(frontend)/chat/[id]/ChatThreadClient.tsx` (update title + thread list)

## Phase 4: User Story 2 - Cannot rename others' chats (Priority: P2)

**Goal**: Access denied for foreign and unauthenticated renames

- [x] T007 [US2] Integration tests for owner success and non-owner denial in `tests/int/rename-chat.int.spec.ts`

## Phase 5: Polish

- [x] T008 [P] Mark completed tasks; validation unit tests pass offline; access tests need DB
- [x] T009 Manual quickstart steps remain valid per `quickstart.md`

## Dependencies & Execution Order

- Setup → Foundational (T002) → US1 (T004–T006) → US2 tests (T003 can early, T007 full) → Polish
- T005 depends on T004 contract shape; T006 depends on T005

## Implementation Strategy

MVP = T002–T006. US2 tests ship with the same PR as access checks in PATCH.
