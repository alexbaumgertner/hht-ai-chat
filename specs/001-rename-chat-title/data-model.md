# Data Model: Rename Chat Title

## Entities

### Chat (existing)

| Field | Change |
| --- | --- |
| `id` | unchanged |
| `user` | ownership key — unchanged |
| `title` | **writable by owner via new patient API**; max 120 after trim |
| `status` | unchanged (`active` \| `archived`) |
| `prompt` / snapshots | still update-locked via field access |
| `createdAt` / `updatedAt` | `updatedAt` refreshes on title change (Payload timestamps) |

No new collections, globals, or migrations.

## Validation rules

| Rule | Enforcement |
| --- | --- |
| Required non-empty after trim | API 400 |
| Max length 120 (after trim) | API 400 |
| Owner-only update | Access + explicit owner check |

## Relationships

Unaffected: Chat → User (owner), Chat → Messages, Chat → Prompt snapshot.
