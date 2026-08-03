<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Modified principles: placeholders → project principles I–V
- Added sections: Stack & Architecture Locks; Domain Safety & Scope; Agent Workflow
- Removed sections: none (template placeholders filled)
- Follow-up TODOs: none
-->

# HHT AI Chat Constitution

## Core Principles

### I. Secrets Stay Server-Side (NON-NEGOTIABLE)

AI provider API keys and other secrets MUST never be returned to browsers or
patient-facing JSON. Keys live in Payload globals (`ai-settings`), env overrides
(`OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`), or server-only code paths.
Client bundles, patient REST responses, and logs exposed to users MUST NOT
include secret values.

### II. Ownership Access Control

Patients MAY read and mutate only their own chats and messages. Admins retain
full access via Payload admin. Use Payload Local API with the authenticated
`user` and `overrideAccess: false` unless a documented server-side reason
requires elevated access (e.g. seeding defaults). Ownership MUST be enforced
on every patient-facing API route.

### III. Patient Auth & Admin Provisioning

Patients authenticate via the existing NextAuth / OTP login flows. Admins
create patient accounts — no public self-registration for this medical product
context. Auth checks MUST fail closed (401/403) when the session is missing or
the role is incorrect.

### IV. Verifiable Quality Gates

Leave the repository buildable and testable after each meaningful slice.
Prefer Vitest integration tests for limits, access, AI helpers, and prompt
rules; use Playwright for login and primary chat paths when UI behavior
changes. Schema changes MUST update generated types (`pnpm generate:types`)
and import maps as needed (`pnpm generate:importmap`).

### V. Spec-Driven, Scoped Change

Behavior changes that affect product contracts (roles, limits, AI prompts,
auth, PDF, access) MUST start from a Spec Kit feature under `specs/`
(specify → plan → tasks → implement) guided by this constitution. Tiny
one-line fixes may skip implement automation but MUST still respect these
principles. Do not reverse-spec the entire shipped patient-chat v1 into a
single feature folder.

## Stack & Architecture Locks

**Locked stack** (do not re-select frameworks per feature):

- Next.js 16 App Router, React 19, TypeScript
- Payload CMS 3.x + Postgres (`@payloadcms/db-postgres`)
- Patient UI: Ant Design (`antd`)
- AI: Vercel AI SDK (`ai` + provider packages), server-side streaming
- PDF: `pdfkit`
- Tests: Vitest (int) + Playwright (e2e)
- Package manager: `pnpm`

**Architecture conventions**:

- Payload CMS work follows `.agents/skills/payload/SKILL.md` and its reference docs
- AI routing and limit helpers live under `src/lib/ai/`
- Prefer extending existing collections/globals and App Router API routes over
  parallel stacks
- Chat limit unit is **messages per month** unless a constitution amendment
  and feature spec change it

## Domain Safety & Scope

**Medical product posture**:

- System prompts and UX MUST frame HHT education only; urge professional care
  for emergencies; never claim definitive diagnosis or clinical decision support
  certification
- Fixed medical disclaimer MUST appear in patient UI and PDF export
- Provider errors are logged server-side; clients receive generic errors

**Default out of scope** (require explicit product decision + constitution or
spec amendment to adopt):

- Voice
- Multi-provider failover UI
- Shared / family accounts
- Mobile native apps
- Public patient self-registration

Historical v1 product brief: `docs/tech-spec-patient-ai-chat.md` and
`docs/agent-impl-patient-ai-chat.md` (human long-form; Spec Kit owns executable
feature artifacts under `specs/`).

## Agent Workflow

1. Read this constitution and `AGENTS.md` before implementing product changes.
2. For CMS collection/field/hook/access work, load the Payload skill.
3. Prefer Spec Kit skills under `.cursor/skills/speckit-*` for feature work:
   constitution → specify → clarify → plan → tasks → implement.
4. Do not install BMAD as a default parallel process; optional one-off product
   discovery only, then export into Spec Kit.
5. Tests and acceptance scenarios in the active feature `spec.md` / `tasks.md`
   are the completion criteria for implementation slices.

## Governance

- This constitution supersedes ad-hoc agent preferences when they conflict.
- Amendments require an updated version line, ISO dates, and a Sync Impact
  Report comment at the top of this file.
  - MAJOR: remove or redefine non-negotiable principles
  - MINOR: add principles or materially expand sections
  - PATCH: clarifications and non-semantic wording
- All PRs and agent implementations MUST verify compliance with principles
  I–IV before merge when touching secrets, access, auth, or tests.
- Runtime agent entrypoint: `AGENTS.md`. Human product docs remain in `docs/`.

**Version**: 1.0.0 | **Ratified**: 2026-08-03 | **Last Amended**: 2026-08-03
