'use client'

import { Button, Layout, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import React from 'react'

import { DisclaimerBanner } from './DisclaimerBanner'
import { QuotaIndicator } from './QuotaIndicator'
import { ThreadList, type ThreadSummary } from './ThreadList'

const { Header, Sider, Content } = Layout

type Props = {
  threads: ThreadSummary[]
  activeId?: string
  used: number
  limit: number
  threadsLoading?: boolean
  headerExtra?: React.ReactNode
  children: React.ReactNode
}

export function ChatShell({
  threads,
  activeId,
  used,
  limit,
  threadsLoading,
  headerExtra,
  children,
}: Props) {
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    router.push('/login')
    router.refresh()
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#eef2f0' }}>
      <Header
        style={{
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #dde3df',
          paddingInline: 20,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, color: '#1a5f4a' }}>
          HHT AI Chat
        </Typography.Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <QuotaIndicator used={used} limit={limit} />
          {headerExtra}
          <Button onClick={() => void logout()}>Log out</Button>
        </div>
      </Header>
      <Layout>
        <Sider
          width={260}
          theme="light"
          style={{
            background: '#fff',
            borderRight: '1px solid #dde3df',
            padding: 16,
            overflow: 'auto',
          }}
        >
          <ThreadList threads={threads} activeId={activeId} loading={threadsLoading} />
        </Sider>
        <Content style={{ padding: 20, maxWidth: 960, width: '100%', margin: '0 auto' }}>
          <DisclaimerBanner />
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}
