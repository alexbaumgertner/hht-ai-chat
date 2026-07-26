'use client'

import { UserOutlined } from '@ant-design/icons'
import { Avatar, Tooltip, Typography } from 'antd'
import React from 'react'

export type ChatUser = {
  email: string
  name?: string | null
  image?: string | null
}

type Props = {
  user: ChatUser
  compact?: boolean
}

export function UserBadge({ user, compact }: Props) {
  const label = user.name || user.email

  return (
    <Tooltip title={user.name ? `${user.name} (${user.email})` : user.email}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Avatar
          size={compact ? 28 : 32}
          src={user.image || undefined}
          icon={<UserOutlined />}
          alt={label}
        />
        {compact ? null : (
          <Typography.Text type="secondary" ellipsis style={{ maxWidth: 180 }}>
            {user.email}
          </Typography.Text>
        )}
      </div>
    </Tooltip>
  )
}
