export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export interface CompletionUsage {
  promptTokens: number
  completionTokens: number
}

export interface CompletionResult {
  content: string
  usage?: CompletionUsage
}

export interface CompletionInput {
  messages: ChatMessage[]
  /** Optional system prompt prepended to the conversation. */
  system?: string
}

/**
 * Provider abstraction so the app is not coupled to any single AI vendor.
 * Admins will later register concrete providers ("tools") in the CMS; Phase 1
 * resolves a provider from environment variables.
 */
export interface AIProvider {
  readonly id: string
  complete(input: CompletionInput): Promise<CompletionResult>
}
