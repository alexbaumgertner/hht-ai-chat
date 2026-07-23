'use client'

import { Button, Empty, Spin, Typography } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React from 'react'

export type ThreadSummary = {
  id: string | number
  title: string
  updatedAt?: string | null
}

type Props = {
  threads: ThreadSummary[]
  activeId?: string
  loading?: boolean
}

export function ThreadList({ threads, activeId, loading }: Props) {
  const router = useRouter()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <Button type="primary" block onClick={() => router.push('/chat')}>
        New chat
      </Button>
      {threads.length === 0 && !loading ? (
        <Empty description="No conversations yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Spin spinning={!!loading}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
            {threads.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 10px',
                  background: String(item.id) === activeId ? 'rgba(26, 95, 74, 0.08)' : undefined,
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                <Link href={`/chat/${item.id}`} style={{ width: '100%', color: 'inherit' }}>
                  <Typography.Text ellipsis style={{ display: 'block', maxWidth: 200 }}>
                    {item.title || 'Untitled'}
                  </Typography.Text>
                </Link>
              </div>
            ))}
          </div>
        </Spin>
      )}
    </div>
  )
}
