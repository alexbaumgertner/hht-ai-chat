import { NextResponse } from 'next/server'

import { checkMessageLimit } from '@/lib/ai/limits'
import { loadAiSettings } from '@/lib/ai/settings'
import { getAuthenticatedUser, requirePatient } from '@/lib/auth'

export async function GET() {
  const { payload, user } = await getAuthenticatedUser()

  if (!requirePatient(user)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const chats = await payload.find({
    collection: 'chats',
    where: {
      user: { equals: user.id },
    },
    sort: '-updatedAt',
    limit: 100,
    depth: 0,
    user,
    overrideAccess: false,
  })

  const settings = await loadAiSettings(payload)
  const limitCheck = await checkMessageLimit(payload, user, settings)

  return NextResponse.json({
    docs: chats.docs.map((chat) => ({
      id: chat.id,
      title: chat.title,
      status: chat.status,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    })),
    quota: {
      used: limitCheck.used,
      limit: limitCheck.limit,
      remaining: limitCheck.remaining,
    },
  })
}
