'use client'

import { App, Button, Typography } from 'antd'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { ChatShell } from '@/components/chat/ChatShell'
import { Composer } from '@/components/chat/Composer'
import { MessageList, type ChatMessage } from '@/components/chat/MessageList'
import type { ThreadSummary } from '@/components/chat/ThreadList'

type Quota = { used: number; limit: number; remaining: number }

export default function ChatThreadClient() {
  const params = useParams<{ id: string }>()
  const chatId = params.id
  const router = useRouter()
  const { message } = App.useApp()

  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [title, setTitle] = useState('Chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [quota, setQuota] = useState<Quota>({ used: 0, limit: 50, remaining: 50 })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [streaming, setStreaming] = useState('')

  const load = useCallback(async () => {
    try {
      const [threadRes, listRes] = await Promise.all([
        fetch(`/api/chats/${chatId}`, { credentials: 'include' }),
        fetch('/api/chats', { credentials: 'include' }),
      ])

      if (threadRes.status === 401 || listRes.status === 401) {
        router.push('/login')
        return
      }

      if (!threadRes.ok) {
        message.error('Chat not found')
        router.push('/chat')
        return
      }

      const threadData = (await threadRes.json()) as {
        chat: { title: string }
        messages: ChatMessage[]
        quota: Quota
      }
      const listData = (await listRes.json()) as { docs: ThreadSummary[]; quota: Quota }

      setTitle(threadData.chat.title)
      setMessages(
        threadData.messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
      )
      setQuota(threadData.quota)
      setThreads(listData.docs)
    } catch {
      message.error('Could not load chat')
    } finally {
      setLoading(false)
    }
  }, [chatId, message, router])

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
        body: JSON.stringify({ chatId, content }),
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
      await load()
    } catch {
      message.error('Something went wrong. Please try again.')
      setMessages((prev) => prev.slice(0, -1))
      setStreaming('')
    } finally {
      setSending(false)
    }
  }

  const downloadPdf = () => {
    window.location.href = `/api/chats/${chatId}/pdf`
  }

  return (
    <ChatShell
      threads={threads}
      activeId={chatId}
      used={quota.used}
      limit={quota.limit}
      threadsLoading={loading}
      headerExtra={
        <Button onClick={downloadPdf} disabled={messages.length === 0}>
          Download PDF
        </Button>
      }
    >
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {title}
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
