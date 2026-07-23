import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { resetElapsedUsagePeriods } from '@/lib/ai/limits'
import config from '@/payload.config'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const resetCount = await resetElapsedUsagePeriods(payload)

  return NextResponse.json({ ok: true, resetCount })
}
