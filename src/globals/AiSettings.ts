import type { GlobalConfig } from 'payload'

import { adminFieldOnly, adminOnly } from '@/access'

export const AiSettings: GlobalConfig = {
  slug: 'ai-settings',
  label: 'AI Settings',
  access: {
    read: adminOnly,
    update: adminOnly,
  },
  fields: [
    {
      name: 'provider',
      type: 'select',
      required: true,
      defaultValue: 'openai',
      options: [
        { label: 'OpenAI', value: 'openai' },
        { label: 'Gemini', value: 'gemini' },
      ],
    },
    {
      name: 'apiKey',
      type: 'text',
      admin: {
        description:
          'API key for the selected provider. Never exposed to patients. Optional env override: OPENAI_API_KEY (OpenAI) or GOOGLE_GENERATIVE_AI_API_KEY (Gemini).',
      },
      access: {
        read: adminFieldOnly,
        update: adminFieldOnly,
      },
    },
    {
      name: 'model',
      type: 'text',
      required: true,
      defaultValue: 'gpt-4.1',
      admin: {
        description:
          'Model id for the selected provider (e.g. gpt-4.1 for OpenAI, gemini-2.5-flash for Gemini).',
      },
    },
    {
      name: 'defaultMessageLimit',
      type: 'number',
      required: true,
      defaultValue: 50,
      admin: {
        description: 'Default monthly message limit when a user has no override.',
      },
    },
    {
      name: 'systemPrompt',
      type: 'textarea',
      required: true,
      defaultValue: `You are an educational assistant for patients with Hereditary Hemorrhagic Telangiectasia (HHT).

Rules:
- Provide general HHT education about symptoms, tests, treatments, and lifestyle.
- Do NOT give definitive medical diagnoses or replace professional clinical care.
- For emergencies (severe bleeding, chest pain, neurological symptoms, difficulty breathing), urge the patient to seek emergency care immediately.
- Be clear, compassionate, and evidence-oriented.
- Always remind users that this is educational information, not medical advice.`,
      admin: {
        description: 'System prompt sent with every chat turn.',
      },
    },
  ],
}
