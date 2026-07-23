'use client'

import { App, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { ChatShell } from '@/components/chat/ChatShell'
import { Composer } from '@/components/chat/Composer'
import { MessageList, type ChatMessage } from '@/components/chat/MessageList'
import type { ThreadSummary } from '@/components/chat/ThreadList'

type Quota = { used: number; limit: number; remaining: number }

async function fetchThreads(): Promise<{ docs: ThreadSummary[]; quota: Quota }> {
  const res = await fetch('/api/chats', { credentials: 'include' })
  if (res.status === 401) {
    throw new Error('unauthorized')
  }
  if (!res.ok) throw new Error('Failed to load chats')
  return res.json()
}

export default function ChatHomeClient() {
  const router = useRouter()
  const { message } = App.useApp()
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [quota, setQuota] = useState<Quota>({ used: 0, limit: 50, remaining: 50 })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await fetchThreads()
      setThreads(data.docs)
      setQuota(data.quota)
    } catch (err) {
      if (err instanceof Error && err.message === 'unauthorized') {
        router.push('/login')
        return
      }
      message.error('Could not load chats')
    } finally {
      setLoading(false)
    }
  }, [message, router])

  useEffect(() => {
    void load()
  }, [load])

  const overLimit = quota.remaining <= 0

  const onSend = async (content: string) => {
    setSending(true)
    setMessages((prev) => [...prev, { role: 'user', content }])
    setStreaming('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (res.status === 429) {
        const data = (await res.json()) as { error?: string }
        message.warning(data.error || 'Monthly message limit reached')
        setMessages((prev) => prev.slice(0, -1))
        await load()
        return
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        message.error(data.error || 'Failed to send message')
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      const chatId = res.headers.get('X-Chat-Id')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          full += decoder.decode(value, { stream: true })
          setStreaming(full)
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: full }])
      setStreaming('')

      if (chatId) {
        router.push(`/chat/${chatId}`)
      } else {
        await load()
      }
    } catch {
      message.error('Something went wrong. Please try again.')
      setMessages((prev) => prev.slice(0, -1))
      setStreaming('')
    } finally {
      setSending(false)
    }
  }

  return (
    <ChatShell threads={threads} used={quota.used} limit={quota.limit} threadsLoading={loading}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        New conversation
      </Typography.Title>
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #dde3df',
          padding: 16,
          minHeight: 360,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: 1, overflow: 'auto', marginBottom: 12 }}>
          <MessageList messages={messages} streamingContent={streaming} />
        </div>
        {overLimit ? (
          <Typography.Text type="danger">
            You have reached your monthly message limit. Please check back next month.
          </Typography.Text>
        ) : null}
        <Composer disabled={overLimit} loading={sending} onSend={onSend} />
      </div>
    </ChatShell>
  )
}
