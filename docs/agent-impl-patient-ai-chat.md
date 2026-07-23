# Agent Implementation Brief: Patient AI Chat

Source of truth: [tech-spec-patient-ai-chat.md](./tech-spec-patient-ai-chat.md).

## Stack

- Next.js 16 App Router + Payload 3 + Postgres
- Patient UI: Ant Design (`antd`)
- AI: Vercel AI SDK (`ai` + `@ai-sdk/openai` / `@ai-sdk/google`), streaming
- PDF: `pdfkit`
- Limit unit: messages per month

## Phase order

0. Scaffold (deps, AntdRegistry, this brief)
1. Extend `users` (role, limits)
2. `ai-settings` global
3. `chats` + `messages` collections
4. `src/lib/ai/*` (limits, provider, disclaimer)
5. `/api/chat`, `/api/chats`, `/api/chats/[id]`
6. Patient UI: `/login`, `/chat`, `/chat/[id]`
7. `/api/chats/[id]/pdf`
8. Monthly reset cron
9. Tests

## Hard rules

- **Never** expose `ai-settings.apiKey` to the browser or patient-facing JSON.
- Prefer Payload Local API with `user` + `overrideAccess: false`.
- Admin creates patients (no public self-registration).
- Leave the repo buildable after each phase.
- Do not implement out-of-scope items (voice, multi-provider UI, family accounts).

## Acceptance checklist

- [x] Patient can chat when under limit
- [x] Over-limit → clear block; no provider call
- [x] Admin sets API key + limits in Payload
- [x] API key never returned to browser
- [x] History persists; own chats only
- [x] PDF download with disclaimer
- [x] Day-to-day chat does not require admin present

## Env vars

- `DATABASE_URL`, `PAYLOAD_SECRET` (required)
- `OPENAI_API_KEY` (optional override for `ai-settings.apiKey` when provider is OpenAI)
- `GOOGLE_GENERATIVE_AI_API_KEY` (optional override for `ai-settings.apiKey` when provider is Gemini)
- `CRON_SECRET` (Bearer token for `GET /api/cron/reset-usage`)
