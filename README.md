# HHT AI Chat

An incremental chat helper for people living with hereditary hemorrhagic
telangiectasia (HHT). The current MVP is an educational, stateless AI chat; it is not a
diagnostic or emergency service.

See [the architecture and delivery phases](docs/ARCHITECTURE.md).

## Stack

- Next.js 16 App Router and Payload CMS
- Neon Postgres through `@payloadcms/db-postgres`
- Ant Design and CSS Modules (no Tailwind CSS)
- Vercel AI SDK and AI Gateway
- Zod, Vitest, Playwright, ESLint, and Prettier

## Local setup

1. Install Node.js 20.9+ and pnpm 9+.
2. Copy `.env.example` to `.env`.
3. Set `PAYLOAD_SECRET` and a Postgres `DATABASE_URL`.
4. For AI responses, link the project to Vercel, enable AI Gateway, and pull an OIDC
   token with `vercel env pull .env.local`. A static `AI_GATEWAY_API_KEY` is an
   alternative for non-Vercel environments.
5. Run `pnpm install` and `pnpm dev`.

For a disposable local Postgres instance, run `docker compose up postgres`.

The patient chat is at `/`; Payload Admin is at `/admin`.

## Quality commands

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test:unit
pnpm test:e2e:chat
pnpm build
```

The full Payload Admin end-to-end test (`pnpm test:e2e`) requires a configured test
database.
