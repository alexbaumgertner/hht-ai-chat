<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

`hht-ai-chat` is a single Next.js 16 (App Router, TypeScript, Tailwind v4) web app that persists chat conversations to MongoDB via `mongoose`. There is one product/service: the Next.js app plus a local MongoDB it depends on.

### MongoDB is required and must be started manually

- MongoDB 8.0 is installed in the VM snapshot, but there is **no systemd**, so `systemctl`/`service` do not work. Start it directly and leave it running:
  `mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017`
  (The `/data/db` directory already exists.) A convenient pattern is to run it in a tmux session so it survives.
- The app reads `MONGODB_URI` (see `.env.local` / `.env.example`); it defaults to `mongodb://127.0.0.1:27017/hht-ai-chat` in `lib/mongodb.ts` if unset. Requests to `/api/chat` return HTTP 500 if MongoDB is not running.
- The mongoose connection is cached on `globalThis` (`lib/mongodb.ts`) so dev-server hot reloads do not open a new connection each time.

### Running / testing (standard scripts, see `package.json`)

- Dev server: `pnpm dev` (Turbopack, http://localhost:3000). Lint: `pnpm lint`. Build: `pnpm build`.
- No automated test suite exists yet; verify changes via the dev server + the `/api/chat` endpoint.

### AI provider is optional

- Chat is fully functional with **no credentials**: without `OPENAI_API_KEY` the `/api/chat` route replies in a deterministic local "mock" mode. Set `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) to get real responses via the Vercel AI SDK (`ai` + `@ai-sdk/openai`). Do not treat a missing key as a blocker.
