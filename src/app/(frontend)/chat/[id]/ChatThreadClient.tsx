'use client'

import { FilePdfOutlined } from '@ant-design/icons'
import { App, Button, Grid, Tooltip } from 'antd'
import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

import { ChatPanel } from '@/components/chat/ChatPanel'
import { ChatShell } from '@/components/chat/ChatShell'
import type { ChatMessage } from '@/components/chat/MessageList'
import type { ThreadSummary } from '@/components/chat/ThreadList'
import type { ChatUser } from '@/components/chat/UserBadge'

type Quota = { used: number; limit: number; remaining: number }

export default function ChatThreadClient({ user }: { user: ChatUser }) {
  const params = useParams<{ id: string }>()
  const chatId = params.id
  const router = useRouter()
  const { message } = App.useApp()
  const screens = Grid.useBreakpoint()
  const isDesktop = screens.md !== false

  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [title, setTitle] = useState('Chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [quota, setQuota] = useState<Quota>({ used: 0, limit: 50, remaining: 50 })
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [renaming, setRenaming] = useState(false)
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

  const onRename = async (nextTitle: string) => {
    setRenaming(true)
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: nextTitle }),
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        chat?: { title?: string }
      }

      if (!res.ok) {
        message.error(data.error || 'Could not rename chat')
        throw new Error(data.error || 'rename failed')
      }

      const saved = data.chat?.title ?? nextTitle.trim()
      setTitle(saved)
      setThreads((prev) =>
        prev.map((t) => (String(t.id) === String(chatId) ? { ...t, title: saved } : t)),
      )
      message.success('Conversation renamed')
    } finally {
      setRenaming(false)
    }
  }

  const downloadPdf = () => {
    window.location.href = `/api/chats/${chatId}/pdf`
  }

  const pdfDisabled = messages.length === 0

  const headerExtra = isDesktop ? (
    <Button onClick={downloadPdf} disabled={pdfDisabled}>
      Download PDF
    </Button>
  ) : (
    <Tooltip title="Download PDF">
      <Button
        type="text"
        icon={<FilePdfOutlined />}
        aria-label="Download PDF"
        onClick={downloadPdf}
        disabled={pdfDisabled}
      />
    </Tooltip>
  )

  return (
    <ChatShell
      threads={threads}
      activeId={chatId}
      used={quota.used}
      limit={quota.limit}
      user={user}
      threadsLoading={loading}
      headerExtra={headerExtra}
    >
      <ChatPanel
        title={title}
        messages={messages}
        streamingContent={streaming}
        overLimit={overLimit}
        sending={sending}
        onSend={onSend}
        onRename={onRename}
        renaming={renaming}
      />
    </ChatShell>
  )
}
