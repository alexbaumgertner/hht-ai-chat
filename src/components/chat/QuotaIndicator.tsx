'use client'

import { Progress, Typography } from 'antd'
import React from 'react'

type Props = {
  used: number
  limit: number
  compact?: boolean
}

export function QuotaIndicator({ used, limit, compact }: Props) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const remaining = Math.max(0, limit - used)
  const status = remaining === 0 ? 'exception' : percent >= 80 ? 'active' : 'normal'

  if (compact) {
    return (
      <div style={{ minWidth: 56 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {used}/{limit}
        </Typography.Text>
        <Progress percent={percent} size="small" status={status} showInfo={false} />
      </div>
    )
  }

  return (
    <div style={{ minWidth: 160 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Messages this month: {used}/{limit}
      </Typography.Text>
      <Progress percent={percent} size="small" status={status} showInfo={false} />
    </div>
  )
}
