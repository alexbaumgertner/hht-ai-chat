# Research: Rename Chat Title

## Decision 1: API method and path

**Decision**: `PATCH /api/chats/[id]` with JSON body `{ "title": string }`.

**Rationale**: Resource already exposed under GET on this path; PATCH is the
natural partial update for a single field. Matches App Router route colocation.

**Alternatives considered**:

- `PUT /api/chats/[id]/title` — extra route file without benefit
- Payload REST only from browser — would expose broader update surface and
  complicate auth cookie/session alignment with existing patient helpers

## Decision 2: Authorization pattern

**Decision**: Reuse `getAuthenticatedUser` + `requirePatient`, then
`findByID` / `update` with `user` and `overrideAccess: false`. Explicit owner
id equality check before update (same pattern as GET).

**Rationale**: Constitution II; mirrors existing GET handler in the same file.

**Alternatives considered**:

- `overrideAccess: true` with manual where-clause only — less consistent with
  current patient routes

## Decision 3: Validation

**Decision**: Server-side: `title.trim()`, reject if empty or length > 120.
Return 400 with `{ error: string }`. Client mirrors for UX, server is source of truth.

**Rationale**: Spec FR-002/FR-003; prevents whitespace-only spam titles.

## Decision 4: UI pattern

**Decision**: On open chat (`ChatThreadClient`), use Ant Design
`Typography.Title` editable (or button + Input) in `ChatPanel` via optional
`onRename` prop so home new-chat view stays non-editable.

**Rationale**: Spec requires open-conversation control; home screen for new chats
has no stable id until first message creates the chat.

## Decision 5: Tests

**Decision**: Vitest integration tests against Payload Local API for update
ownership and validation helpers; optionally call PATCH handler if route tests
are lightweight. Prefer testing the validation + update semantics used by PATCH
via direct payload + a small exported validator if useful.

**Rationale**: Existing suite uses Payload Local API heavily; full HTTP e2e not
required for this slice (SC-002 covered by ownership tests).
