export const CHAT_TITLE_MAX_LENGTH = 120

export type TitleValidationResult =
  | { ok: true; title: string }
  | { ok: false; error: string }

/**
 * Normalize and validate a patient-supplied chat title.
 * Spec 001-rename-chat-title: trim, non-empty, max 120.
 */
export function validateChatTitle(raw: unknown): TitleValidationResult {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Title is required' }
  }

  const title = raw.trim()

  if (!title) {
    return { ok: false, error: 'Title is required' }
  }

  if (title.length > CHAT_TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Title must be at most ${CHAT_TITLE_MAX_LENGTH} characters`,
    }
  }

  return { ok: true, title }
}
