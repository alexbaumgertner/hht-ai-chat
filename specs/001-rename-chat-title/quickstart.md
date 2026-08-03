# Quickstart: Rename Chat Title

## Manual check

1. `pnpm dev` with valid env (`DATABASE_URL`, secrets).
2. Log in as a patient → open an existing chat (or create one with a message).
3. Edit the conversation title → save.
4. Confirm sidebar list updates and title survives refresh.
5. Confirm empty title cannot be saved.

## Automated

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/chat-title.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/rename-chat.int.spec.ts  # needs DATABASE_URL
```

## API smoke (authenticated session cookie)

```bash
curl -X PATCH "http://localhost:3000/api/chats/<id>" \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"title":"Renamed thread"}'
```
