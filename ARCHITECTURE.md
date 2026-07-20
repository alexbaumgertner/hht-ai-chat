# HHT AI Chat — Architecture

A chat assistant for **HHT** (Hereditary Hemorrhagic Telangiectasia / Osler–Weber–Rendu) patients.
Patients upload medical results (blood tests, imaging reports, etc.) and ask an AI assistant about
their condition, treatment options, lifestyle and symptoms. Each answer is grounded in the patient's
own uploaded documents and prior conversation context.

> **Medical disclaimer:** This product is an informational assistant, **not** a medical device and
> **not** a substitute for professional medical advice. Every AI answer must carry a visible
> disclaimer, and the system must never present output as a diagnosis. This constraint shapes several
> architectural decisions below (auditability, guardrails, source citations).

---

## 1. Goals & requirements

Functional requirements (from the product brief):

1. Users upload medical checks / blood tests and other documents.
2. Users chat with a **selectable AI tool** about cures, lifestyle, symptoms, etc.
3. Auth via **VK ID**, **Yandex ID**, and **email one-time password (OTP)**.
4. Users can **share a chat** with other people by email.
5. A user can have **multiple chats**, and can **share context between chats**.
6. Each user has **AI usage limits** configured by an admin.
7. An admin can register **AI provider API tokens** for different tools and set usage limits.

Non-functional requirements:

- Runs on **Vercel** (serverless / fluid compute) with **Neon Postgres** as the database.
- Strong data isolation (medical data is sensitive — treat as PHI-like).
- Auditable AI usage (who asked what, which model/tool, token cost).
- Type-safe end to end; validated inputs; automated tests.

---

## 2. Technology stack

| Concern         | Choice                                                              | Rationale                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend + Admin | **Payload CMS 3** (running on Next.js App Router)                   | Gives us collections, access control, an admin UI, REST + GraphQL + Local API for free. Admin panel is where operators manage users, AI tokens and limits. |
| Framework       | **Next.js 16** (App Router, React 19, Server Components)            | Payload 3 is a native Next plugin; single deployable app.                                                                                                  |
| Hosting         | **Vercel**                                                          | First-class Next.js + serverless functions + streaming.                                                                                                    |
| Database        | **Neon Postgres** via `@payloadcms/db-postgres`                     | Serverless Postgres, branchable per preview deploy. Local dev uses SQLite for zero-setup (see §11).                                                        |
| Frontend UI kit | **Ant Design 6** (`antd`) + `@ant-design/nextjs-registry`           | Rich component set, SSR style extraction. **No Tailwind.**                                                                                                 |
| Validation      | **Zod 4**                                                           | Runtime validation at every trust boundary (API routes, forms, env).                                                                                       |
| File storage    | **Vercel Blob** (`@payloadcms/storage-vercel-blob`)                 | Vercel's filesystem is ephemeral; medical uploads go to Blob.                                                                                              |
| AI              | Provider-agnostic layer; OpenAI-compatible HTTP + Vercel AI Gateway | Lets the admin plug in "different tools" (OpenAI, Yandex GPT, etc.).                                                                                       |
| Unit tests      | **Vitest 4**                                                        | Fast, ESM-native, used for pure logic (schemas, AI service, context builder).                                                                              |
| E2E tests       | **Playwright**                                                      | Browser-level flows (login, send a message).                                                                                                               |
| Lint / format   | **ESLint + Prettier**                                               | Payload + Next + React best practices.                                                                                                                     |

> **Note on user rules:** the general rule "use Mongoose for MongoDB" is overridden here by the explicit
> project requirement to use **Neon Postgres**. Payload's Postgres adapter (Drizzle-based) is used instead.

---

## 3. High-level system diagram

```
                         ┌──────────────────────────────────────────────┐
                         │                  Vercel                       │
                         │                                               │
  Browser (Antd SPA)  ─► │  Next.js 16 App Router                        │
   - /login              │   ├─ (app)  patient-facing UI (Ant Design)    │
   - /chat               │   │    └─ /api/chat/send  (Server Route)      │
                         │   ├─ (payload) admin panel + REST/GraphQL     │
                         │   │    └─ /admin, /api/*                       │
                         │   └─ Payload core (access control, hooks)     │
                         │            │            │            │        │
                         └────────────┼────────────┼────────────┼────────┘
                                      │            │            │
                              ┌───────▼──┐   ┌─────▼─────┐  ┌───▼──────────┐
                              │  Neon    │   │  Vercel   │  │ AI providers │
                              │ Postgres │   │  Blob     │  │ (OpenAI /    │
                              │          │   │ (uploads) │  │  Yandex/…)   │
                              └──────────┘   └───────────┘  └──────────────┘
                                      ▲
                                      │  email OTP / share invites
                              ┌───────┴───────┐
                              │ Email (Resend)│
                              └───────────────┘
```

Two Next.js **route groups** live in one app:

- `src/app/(payload)/` — Payload admin panel and its REST/GraphQL API (operators only).
- `src/app/(app)/` — the patient-facing Ant Design application and its purpose-built API routes.

---

## 4. Data model (Payload collections)

Phase 1 ships the collections in **bold**; the rest are specified here and added in later phases.

- **`users`** (auth-enabled)
  - `email`, auth fields (Payload built-in).
  - `name`.
  - `roles: ['admin' | 'patient']` (default `patient`).
  - `aiLimits` group: `monthlyTokenLimit`, `monthlyRequestLimit`, `tokensUsedThisPeriod`, `requestsUsedThisPeriod`, `periodStartedAt`. _(fields present from Phase 1; enforcement lands in Phase 4)_.
  - `linkedAccounts` array: `{ provider: 'vk' | 'yandex', providerAccountId }` _(Phase 3)_.
- **`chats`**
  - `title`, `owner` (relationship → users).
  - `sharedWith` array of `{ email, permission: 'read' | 'write', invitedAt, acceptedBy? }` _(Phase 5)_.
  - `linkedChats` (relationship → chats, hasMany) for cross-chat context sharing _(Phase 6)_.
  - `aiTool` (relationship → `ai-tools`) — the selected tool for this chat _(Phase 4; Phase 1 uses the default provider)_.
- **`messages`**
  - `chat` (relationship → chats), `owner` (relationship → users).
  - `role: 'user' | 'assistant' | 'system'`.
  - `content` (textarea/richtext).
  - `attachments` (relationship → media, hasMany) _(Phase 2)_.
  - `meta` group: `provider`, `model`, `promptTokens`, `completionTokens` (usage audit).
- `media` _(Phase 2)_ — uploads (Vercel Blob), `owner`, `kind: 'blood-test' | 'imaging' | 'report' | 'other'`, extracted-text cache for retrieval.
- `ai-tools` _(Phase 4)_ — admin-managed provider registry: `name`, `providerType` (`openai-compatible` | `gateway`), `baseUrl`, `model`, `apiKey` (encrypted), `enabled`, `defaultForNewChats`, per-tool rate limits.
- `ai-usage-events` _(Phase 4)_ — append-only audit log: `user`, `chat`, `tool`, `promptTokens`, `completionTokens`, `costEstimate`, `createdAt`.
- `otp-tokens` _(Phase 3)_ — hashed email OTPs with `expiresAt`, `attempts` (or delegate to Payload's built-in login token + a custom endpoint).

### Access control (row-level)

Every collection uses Payload access functions keyed on the authenticated user:

- Patients can read/update **only** rows they own (`owner == user.id`) plus chats shared with their email.
- Admins (`user.roles.includes('admin')`) can access everything.
- `ai-tools.apiKey` is never returned to patient-scoped requests (field-level `read` access = admin only), and is stored encrypted at rest.

---

## 5. Authentication

Payload's auth is the backbone (it issues the `payload-token` httpOnly cookie and manages sessions).
Three login methods feed into the **same** `users` collection:

1. **Email OTP (Phase 3, primary):**
   `POST /api/auth/otp/request` → generate a 6-digit code, hash it, store with 10-min TTL, email it (Resend).
   `POST /api/auth/otp/verify` → validate code, find-or-create the user, then mint a Payload session
   (via `payload.login` / a signed token) and set the auth cookie.
2. **VK ID (Phase 3):** OAuth2 authorization-code flow. Callback resolves the VK account → find-or-create
   user, link via `linkedAccounts`, mint Payload session.
3. **Yandex ID (Phase 3):** identical OAuth2 pattern with Yandex endpoints.

All three converge on a small `establishSession(user)` helper so the rest of the app only ever deals
with a normal Payload-authenticated user.

> **Phase 1** ships Payload's built-in **email + password** login as the foundation these flows extend.
> This keeps the first increment runnable and testable while the OAuth/OTP providers are added.

---

## 6. AI subsystem

The AI layer is deliberately abstracted so "different tools" can be plugged in by an admin.

```
UI (select tool) ─► /api/chat/send ─► ChatService
                                        ├─ Zod-validate input
                                        ├─ load chat + recent messages (+ linked-chat context)
                                        ├─ enforce per-user AI limits
                                        ├─ resolveProvider(tool)      ◄── ai-tools registry / env
                                        ├─ provider.complete(messages)
                                        ├─ persist user + assistant messages
                                        └─ record ai-usage-event
```

`AIProvider` interface:

```ts
interface AIProvider {
  readonly id: string
  complete(input: {
    messages: ChatMessage[]
    system?: string
  }): Promise<{ content: string; usage?: { promptTokens: number; completionTokens: number } }>
}
```

Phase 1 implementations:

- **`EchoProvider`** (default, zero-config): deterministic assistant reply. Lets the whole flow run and
  be tested offline / without API keys.
- **`OpenAICompatibleProvider`**: talks to any OpenAI Chat Completions-compatible endpoint
  (OpenAI, Vercel AI Gateway, Yandex GPT proxy, etc.) via `baseUrl` + `apiKey` + `model`, read from env.

`resolveProvider()` picks the OpenAI-compatible provider when `AI_API_KEY` is configured, else falls back
to Echo. In later phases it reads the per-chat `ai-tools` row instead of env, so admins control everything
from the panel.

**Grounding (Phase 2+):** uploaded documents are OCR/parsed, chunked, embedded and stored; the ChatService
retrieves relevant chunks and injects them as context, with citations back to the source document.

---

## 7. Sharing & cross-chat context

- **Share a chat by email (Phase 5):** owner adds an email to `chats.sharedWith`. If the email matches an
  existing user it appears in their chat list immediately; otherwise an invite email is sent, and on first
  login the pending shares are attached to the new user. `read` vs `write` permission gates the send route.
- **Cross-chat context (Phase 6):** a chat can reference other chats via `linkedChats`. When building the
  prompt, the ChatService optionally pulls a summarized/most-recent slice from each linked chat (subject to
  a token budget), enabling a patient to carry context (e.g. a prior consultation) into a new conversation.

---

## 8. AI usage limits & admin controls

- Admin sets `aiLimits` per user in the admin panel (Phase 4 enforcement).
- Before each completion, `ChatService` checks `requestsUsedThisPeriod` / `tokensUsedThisPeriod` against the
  user's limits (with a monthly rolling `periodStartedAt` reset). Over-limit → `429` with a clear message.
- After each completion, usage is incremented atomically and an `ai-usage-events` row is appended.
- Admins register providers in `ai-tools` (token, base URL, model, per-tool caps). API keys are encrypted
  at rest and never exposed to patient-scoped API responses.

---

## 9. API surface

Patient-facing (route handlers under `(app)/api`, all Zod-validated, all auth-checked):

- `POST /api/chat/send` — `{ chatId?, content }` → creates a chat if none, persists the user message, runs
  the AI provider, persists + returns the assistant message.
- `POST /api/chat` / `GET /api/chat` — create / list the user's chats _(Phase 1 minimal via Local API)_.
- `POST /api/auth/otp/request|verify`, `GET /api/auth/vk|yandex/callback` _(Phase 3)_.
- `POST /api/chat/:id/share`, `POST /api/uploads` _(Phase 5 / Phase 2)_.

Operator-facing: Payload's auto-generated REST (`/api/{collection}`) and GraphQL (`/api/graphql`) plus the
`/admin` panel.

---

## 10. Testing strategy

- **Unit (Vitest):** pure, DB-free logic — Zod schemas, `EchoProvider`, prompt/context builder, limit math.
  These run in CI and locally with no external services.
- **Integration:** ChatService against a test Postgres (Neon branch or local) using Payload's Local API.
- **E2E (Playwright):** real browser flow — log in, open a chat, send a message, see the assistant reply.
  Runs against a dev server backed by a local SQLite/Postgres DB.

---

## 11. Environments & configuration

Config is validated at startup with Zod (`src/lib/env.ts`). Key variables:

| Variable                                  | Purpose                                                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `PAYLOAD_SECRET`                          | Payload signing secret (required).                                                                    |
| `DATABASE_URI`                            | Neon Postgres URL in prod. If unset locally, the app uses a local **SQLite** file for zero-setup dev. |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`   | Enable the OpenAI-compatible provider; otherwise EchoProvider is used.                                |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Optional: seed a first admin/patient on boot (dev/e2e).                                               |
| `BLOB_READ_WRITE_TOKEN`                   | Vercel Blob (Phase 2).                                                                                |
| `RESEND_API_KEY`, `VK_*`, `YANDEX_*`      | Email + OAuth (Phase 3).                                                                              |

**Database choice:** Neon Postgres is the production and staging database. SQLite is a **local-dev-only**
convenience so the app boots with no external dependencies; the schema is identical (Payload/Drizzle
generates it), and CI/preview environments should point `DATABASE_URI` at a Neon branch.

---

## 12. Delivery roadmap (incremental)

The product is built in small, shippable increments — **not** in one step.

- **Phase 1 — Simple chat ✅ (this PR):** project scaffold on the full stack; `users`/`chats`/`messages`
  collections; email+password auth (Payload built-in); Ant Design chat UI with multiple chats; AI provider
  abstraction (Echo default + OpenAI-compatible); Zod validation; Vitest unit tests; Playwright smoke test.
- **Phase 2 — Uploads & grounding:** `media` collection on Vercel Blob, document parsing, retrieval, citations.
- **Phase 3 — Auth providers:** email OTP, VK ID, Yandex ID.
- **Phase 4 — AI tools & limits:** admin-managed `ai-tools`, per-user limits enforcement, usage audit log,
  tool selector in the chat UI.
- **Phase 5 — Sharing:** share chats by email with read/write permissions and invites.
- **Phase 6 — Cross-chat context:** link chats and share context under a token budget.
- **Phase 7 — Hardening:** streaming responses, rate limiting, observability, medical-safety guardrails, a11y.

---

## 13. Repository layout

```
src/
  payload.config.ts         # Payload config: DB adapter, collections, admin
  collections/              # Users, Chats, Messages
  lib/
    env.ts                  # Zod-validated environment
    ai/                     # AIProvider interface, Echo + OpenAI-compatible, resolver
    validation/             # Zod schemas for API/forms
    chat/                   # context/prompt builder, ChatService helpers
  app/
    (payload)/              # Payload admin panel + REST/GraphQL routes
    (app)/                  # Ant Design patient app + /api/chat/send
tests/
  unit/                     # Vitest
  e2e/                      # Playwright
```
