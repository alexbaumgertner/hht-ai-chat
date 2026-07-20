# hht-ai-chat

An AI chat web app built with **Next.js 16** (App Router, TypeScript), **Tailwind CSS v4**, and **MongoDB** via **mongoose**. Conversations are persisted to MongoDB. Replies come from the [Vercel AI SDK](https://sdk.vercel.ai) when an API key is configured, and fall back to a deterministic local "mock" reply otherwise — so the app runs fully without any credentials.

## Prerequisites

- Node.js 20.9+ (tested on Node 22)
- pnpm
- A running MongoDB instance

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start MongoDB (any local instance works). For example:

   ```bash
   mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017
   ```

3. Copy the example env file and adjust if needed:

   ```bash
   cp .env.example .env.local
   ```

   | Variable         | Required | Default                                      | Notes                                             |
   | ---------------- | -------- | -------------------------------------------- | ------------------------------------------------- |
   | `MONGODB_URI`    | no       | `mongodb://127.0.0.1:27017/hht-ai-chat`      | MongoDB connection string.                        |
   | `OPENAI_API_KEY` | no       | _unset_                                      | If set, enables real AI replies via the AI SDK.   |
   | `OPENAI_MODEL`   | no       | `gpt-4o-mini`                                | Model used when `OPENAI_API_KEY` is set.          |

4. Run the dev server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and start chatting.

## Scripts

- `pnpm dev` — start the development server (Turbopack)
- `pnpm build` — production build
- `pnpm start` — run the production build
- `pnpm lint` — run ESLint

## Project structure

- `app/page.tsx` — chat UI (client component)
- `app/api/chat/route.ts` — chat API route (persists messages, generates replies)
- `lib/mongodb.ts` — cached mongoose connection helper
- `models/Conversation.ts` — mongoose `Conversation` model
