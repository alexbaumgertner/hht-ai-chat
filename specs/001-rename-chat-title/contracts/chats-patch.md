# Contract: PATCH /api/chats/[id]

## Request

```http
PATCH /api/chats/{id}
Content-Type: application/json
Cookie: <patient session>

{
  "title": "My HHT questions March"
}
```

### Path parameters

| Name | Type | Notes |
| --- | --- | --- |
| `id` | string | Chat document id |

### Body

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `title` | string | yes | trim; 1–120 chars after trim |

## Responses

### 200 OK

```json
{
  "chat": {
    "id": 12,
    "title": "My HHT questions March",
    "status": "active",
    "updatedAt": "2026-08-03T12:00:00.000Z"
  }
}
```

### 400 Bad Request

```json
{ "error": "Title is required" }
```

or

```json
{ "error": "Title must be at most 120 characters" }
```

### 401 Unauthorized

```json
{ "error": "Unauthorized" }
```

### 403 Forbidden

```json
{ "error": "Forbidden" }
```

### 404 Not Found

```json
{ "error": "Chat not found" }
```

## Notes

- Does not return messages, quota, or system prompt fields.
- Must not include any AI provider credentials.
