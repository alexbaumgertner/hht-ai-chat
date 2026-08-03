# Agents

Guidance for AI coding agents working in this repository.

## Spec-Driven Development (primary)

This project uses **GitHub Spec Kit** with Cursor (`cursor-agent`).

| Location | Purpose |
| --- | --- |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Non-negotiable product/engineering principles |
| [`.specify/`](.specify/) | Spec Kit templates, scripts, integration config |
| [`specs/`](specs/) | Feature specifications, plans, and task lists |
| [`.cursor/skills/speckit-*`](.cursor/skills/) | Spec Kit Cursor skills |

**Feature loop** (use Cursor skills / slash commands):

1. `/speckit-constitution` — update governing principles (rare)
2. `/speckit-specify` — define what/why for a feature
3. `/speckit-clarify` — resolve open questions
4. `/speckit-plan` — technical plan against the **locked stack** (do not re-choose frameworks)
5. `/speckit-tasks` — ordered implementation tasks
6. `/speckit-implement` — execute tasks

Optional: `/speckit-analyze`, `/speckit-checklist`, `/speckit-converge`.

Do **not** reverse-spec the full patient-chat v1 into one feature. Add new
`specs/[###-name]/` folders for incremental work only.

BMAD Method is **not** the default process here. Use only for occasional
greenfield product discovery; export results into Spec Kit.

## Payload CMS

For Payload collections, fields, hooks, access, and Local API patterns:

1. Start with [`.agents/skills/payload/SKILL.md`](.agents/skills/payload/SKILL.md)
2. Use [`.agents/skills/payload/reference/`](.agents/skills/payload/reference/) for details

## Stack (locked)

Next.js 16 App Router · Payload 3 · Postgres · Ant Design · Vercel AI SDK ·
Vitest + Playwright · `pnpm`

## Tests & codegen

```bash
pnpm test:int          # Vitest integration tests
pnpm test:e2e          # Playwright e2e
pnpm generate:types    # After Payload schema changes
pnpm generate:importmap
```

## Human docs (not Spec Kit)

| Doc | Purpose |
| --- | --- |
| [docs/tech-spec-patient-ai-chat.md](docs/tech-spec-patient-ai-chat.md) | Original product tech spec (v1) |
| [docs/agent-impl-patient-ai-chat.md](docs/agent-impl-patient-ai-chat.md) | Phased implementation brief (v1 shipped) |
| [docs/email.md](docs/email.md) | OTP / email adapter setup |
