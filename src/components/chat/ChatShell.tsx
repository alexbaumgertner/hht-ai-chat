'use client'

import { LogoutOutlined, MenuOutlined } from '@ant-design/icons'
import { Button, Drawer, Grid, Layout, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

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
  const screens = Grid.useBreakpoint()
  // Until breakpoints hydrate, prefer desktop to avoid a mobile flash on large screens.
  const isDesktop = screens.md !== false
  const [drawerOpen, setDrawerOpen] = useState(false)

  const logout = async () => {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    router.push('/login')
    router.refresh()
  }

  const closeDrawer = () => setDrawerOpen(false)

  const threadList = (
    <ThreadList
      threads={threads}
      activeId={activeId}
      loading={threadsLoading}
      onNavigate={isDesktop ? undefined : closeDrawer}
    />
  )

  return (
    <Layout
      className="chat-shell"
      style={{
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden',
        background: '#eef2f0',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <Header
        style={{
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #dde3df',
          paddingInline: isDesktop ? 20 : 12,
          gap: isDesktop ? 16 : 8,
          height: isDesktop ? 64 : 56,
          lineHeight: 'normal',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {!isDesktop ? (
            <Button
              type="text"
              icon={<MenuOutlined />}
              aria-label="Open conversations"
              onClick={() => setDrawerOpen(true)}
            />
          ) : null}
          <Typography.Title
            level={4}
            style={{
              margin: 0,
              color: '#1a5f4a',
              fontSize: isDesktop ? undefined : 16,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isDesktop ? 'HHT AI Chat' : 'HHT Chat'}
          </Typography.Title>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isDesktop ? 16 : 8,
            flexShrink: 0,
          }}
        >
          <QuotaIndicator used={used} limit={limit} compact={!isDesktop} />
          {headerExtra}
          {isDesktop ? (
            <Button onClick={() => void logout()}>Log out</Button>
          ) : (
            <Button
              type="text"
              icon={<LogoutOutlined />}
              aria-label="Log out"
              onClick={() => void logout()}
            />
          )}
        </div>
      </Header>
      <Layout style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {isDesktop ? (
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
            {threadList}
          </Sider>
        ) : null}
        <Content
          style={{
            padding: isDesktop ? 20 : 12,
            maxWidth: 960,
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <DisclaimerBanner compact={!isDesktop} />
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
      {!isDesktop ? (
        <Drawer
          title="Conversations"
          placement="left"
          open={drawerOpen}
          onClose={closeDrawer}
          size={280}
          styles={{ body: { padding: 16 } }}
        >
          {threadList}
        </Drawer>
      ) : null}
    </Layout>
  )
}
