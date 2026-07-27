import { NextResponse } from 'next/server'

import { listPromptsForUser } from '@/lib/ai/prompts'
import { getAuthenticatedUser, requirePatient } from '@/lib/auth'

export async function GET() {
  const { payload, user } = await getAuthenticatedUser()

  if (!requirePatient(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const docs = await listPromptsForUser(payload, user)
  return NextResponse.json({ docs })
}
