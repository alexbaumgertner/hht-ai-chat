# Implementation Plan: Rename Chat Title

**Branch**: `001-rename-chat-title` | **Date**: 2026-08-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-rename-chat-title/spec.md`

## Summary

Allow patients to rename own chat titles via `PATCH /api/chats/[id]` with
validation (trim, non-empty, max 120) and ownership checks, plus inline title
edit on the open conversation UI. Reuses existing Payload Local API ownership
access; no schema migration.

## Technical Context

**Language/Version**: TypeScript 5.7, Node 20+

**Primary Dependencies**: Next.js 16 App Router, Payload 3.86, Ant Design 6, next-auth

**Storage**: PostgreSQL via `@payloadcms/db-postgres` (existing `chats.title`)

**Testing**: Vitest integration tests under `tests/int/`

**Target Platform**: Web (Vercel / Node server)

**Project Type**: Full-stack Next.js + Payload mono-app

**Performance Goals**: Title update < 1s under normal load; negligible vs chat turn

**Constraints**: Constitution I–IV (secrets server-side, ownership, auth fail-closed, tests)

**Scale/Scope**: Per-user ≤100 chats listed; title is a small string field

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status |
| --- | --- |
| I. Secrets server-side | Pass — rename payload is title only |
| II. Ownership access | Pass — Local API `user` + `overrideAccess: false`; owner check after load |
| III. Auth fail-closed | Pass — patient-only route; 401 when unauthenticated |
| IV. Quality gates | Pass — Vitest for ownership + validation |
| V. Spec-driven scoped change | Pass — incremental feature, no reverse-spec of v1 |
| Stack locks | Pass — no new frameworks |

## Project Structure

### Documentation (this feature)

```text
specs/001-rename-chat-title/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chats-patch.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/app/api/chats/[id]/route.ts   # add PATCH
src/components/chat/ChatPanel.tsx  # editable title when onRename provided
src/app/(frontend)/chat/[id]/ChatThreadClient.tsx  # wire rename
tests/int/rename-chat.int.spec.ts  # access + validation
```

**Structure Decision**: Single Next.js app — extend existing chat API and UI.

## Complexity Tracking

No constitution violations. No additional abstraction layers.
