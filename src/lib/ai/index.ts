import { env, hasAIProvider } from '@/lib/env'
import { EchoProvider } from './echo-provider'
import { OpenAICompatibleProvider } from './openai-provider'
import type { AIProvider } from './types'

export * from './types'
export { EchoProvider } from './echo-provider'
export { OpenAICompatibleProvider } from './openai-provider'

/**
 * System prompt shared by all providers. Encodes the assistant's role and the
 * non-negotiable medical-safety framing for an HHT patient-facing tool.
 */
export const HHT_SYSTEM_PROMPT = [
  'You are an assistant for patients with HHT (Hereditary Hemorrhagic Telangiectasia,',
  'also called Osler–Weber–Rendu syndrome).',
  'Explain symptoms, lifestyle guidance and treatment options in clear, empathetic language.',
  'You are NOT a doctor and must not diagnose. Always recommend consulting an HHT specialist',
  'for personal medical decisions, and add a short disclaimer to clinical answers.',
].join(' ')

/**
 * Resolve the AI provider to use for a completion.
 *
 * Phase 1: environment-driven (OpenAI-compatible when AI_API_KEY is set, else Echo).
 * Later phases will resolve a per-chat provider from the admin-managed `ai-tools`
 * collection, keeping this call site stable.
 */
export function resolveProvider(): AIProvider {
  if (hasAIProvider && env.AI_API_KEY) {
    return new OpenAICompatibleProvider({
      apiKey: env.AI_API_KEY,
      baseUrl: env.AI_BASE_URL,
      model: env.AI_MODEL,
    })
  }
  return new EchoProvider()
}
