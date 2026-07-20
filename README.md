# HHT AI Chat

A chat assistant for **HHT** (Hereditary Hemorrhagic Telangiectasia) patients. Patients can talk to an
AI assistant about symptoms, lifestyle and treatment options; later phases add document uploads,
social/OTP login, sharing and admin-managed AI tools & limits.

> Informational assistant only — **not** medical advice. See the disclaimer in
> [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Status: Phase 1 — Simple chat

This repository is built **incrementally**. Phase 1 delivers a working, well-architected foundation:

- Payload CMS 3 on **Next.js 16** (App Router, React 19).
- Collections: `users` (auth), `chats`, `messages` with owner-scoped access control.
- Email + password auth (Payload built-in) — the base that VK ID / Yandex ID / email OTP extend later.
- **Ant Design 6** patient UI: multiple chats, message history, composer.
- Provider-agnostic AI layer: an offline **EchoProvider** (default) and an **OpenAI-compatible** provider.
- **Zod** validation at every trust boundary; **Vitest** unit tests; **Playwright** e2e.

The full design and the phase-by-phase roadmap live in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Tech stack

Payload CMS · Next.js 16 · Vercel · Neon Postgres · Ant Design (no Tailwind) · Zod · Vitest · Playwright ·
ESLint · Prettier.

## Getting started

```bash
npm install
cp .env.example .env      # set PAYLOAD_SECRET (a random string is fine for dev)
npm run dev               # http://localhost:3000
```

- Patient app: `http://localhost:3000` (redirects to `/chat`, then `/login`).
- Admin panel: `http://localhost:3000/admin`.

With no `DATABASE_URI`, the app uses a zero-setup local **SQLite** file (`hht-dev.db`). Set
`SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` to have a user created on first boot, or create the first user
via the admin panel.

To enable a real AI backend, set `AI_API_KEY` (+ optional `AI_BASE_URL`, `AI_MODEL`). Otherwise the
offline EchoProvider answers so the chat works out of the box.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the dev server (auto-syncs the DB schema). |
| `npm run build` / `npm run start` | Production build / server. |
| `npm run lint` / `npm run format` | ESLint / Prettier. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run test` | Vitest unit tests. |
| `npm run test:e2e` | Playwright e2e (starts a dev server automatically). |
| `npm run generate:types` | Regenerate `src/payload-types.ts`. |

## Database & deployment (Vercel + Neon)

Production/staging use **Neon Postgres**. Set `DATABASE_URI` to the Neon connection string and
`PAYLOAD_SECRET` to a strong secret.

The local dev server uses Payload's schema "push" for convenience. **Production uses migrations** instead:

```bash
# against a Postgres/Neon DATABASE_URI:
npx payload migrate:create      # generate a migration from the current schema
npx payload migrate             # apply migrations (run this on deploy)
```

Recommended Vercel build command: `payload migrate && next build`.

## Project structure

```
src/
  payload.config.ts     # Payload config: DB adapter (Neon/SQLite), collections, seed
  collections/          # Users, Chats, Messages
  lib/
    env.ts              # Zod-validated environment
    ai/                 # AIProvider interface, Echo + OpenAI-compatible, resolver
    validation/         # Zod schemas
    chat/               # context/prompt builder
  app/
    (payload)/          # Payload admin panel + REST/GraphQL
    (app)/              # Ant Design patient app + /api/chat/send
tests/
  unit/                 # Vitest
  e2e/                  # Playwright
```
