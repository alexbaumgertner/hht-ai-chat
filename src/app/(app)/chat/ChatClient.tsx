'use client'

import { App, Avatar, Button, Empty, Input, Layout, List, Space, Spin, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const { Sider, Header, Content, Footer } = Layout
const { Text, Title } = Typography
const { TextArea } = Input

export interface ChatSummary {
  id: string
  title: string
}

export interface UIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatClientProps {
  userName: string
  initialChats: ChatSummary[]
  initialActiveChatId: string | null
  initialMessages: UIMessage[]
}

export function ChatClient({
  userName,
  initialChats,
  initialActiveChatId,
  initialMessages,
}: ChatClientProps) {
  const router = useRouter()
  const { message: toast } = App.useApp()

  const [chats, setChats] = useState<ChatSummary[]>(initialChats)
  const [activeChatId, setActiveChatId] = useState<string | null>(initialActiveChatId)
  const [messages, setMessages] = useState<UIMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const listEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = useCallback(
    async (chatId: string) => {
      setLoadingMessages(true)
      try {
        const params = new URLSearchParams({
          'where[chat][equals]': chatId,
          sort: 'createdAt',
          limit: '200',
          depth: '0',
        })
        const res = await fetch(`/api/messages?${params.toString()}`, {
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok) throw new Error('Failed to load messages')
        const data = (await res.json()) as { docs: UIMessage[] }
        setMessages(data.docs.map((m) => ({ id: String(m.id), role: m.role, content: m.content })))
      } catch {
        toast.error('Could not load this conversation')
      } finally {
        setLoadingMessages(false)
      }
    },
    [toast],
  )

  const handleSelectChat = useCallback(
    (chatId: string) => {
      if (chatId === activeChatId) return
      setActiveChatId(chatId)
      void loadMessages(chatId)
    },
    [activeChatId, loadMessages],
  )

  const handleNewChat = useCallback(() => {
    setActiveChatId(null)
    setMessages([])
    setInput('')
  }, [])

  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    // Optimistically show the user's message.
    const optimisticId = `optimistic-${Date.now()}`
    setMessages((prev) => [...prev, { id: optimisticId, role: 'user', content }])

    try {
      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: activeChatId ?? undefined, content }),
      })

      if (res.status === 401) {
        router.replace('/login')
        return
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Failed to send message')
      }

      const data = (await res.json()) as {
        chatId: string
        userMessage: UIMessage
        assistantMessage: UIMessage
      }

      const newChatId = String(data.chatId)
      const isNewChat = activeChatId === null
      if (isNewChat) {
        setActiveChatId(newChatId)
        setChats((prev) => [{ id: newChatId, title: content.slice(0, 60) || 'New chat' }, ...prev])
      }

      // Replace the optimistic message with the persisted pair.
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticId),
        { ...data.userMessage, id: String(data.userMessage.id) },
        { ...data.assistantMessage, id: String(data.assistantMessage.id) },
      ])
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setInput(content)
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }, [activeChatId, input, router, sending, toast])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }, [router])

  const activeTitle = useMemo(
    () => chats.find((c) => c.id === activeChatId)?.title ?? 'New chat',
    [chats, activeChatId],
  )

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        width={280}
        theme="light"
        style={{ borderRight: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: 16 }}>
          <Title level={4} style={{ margin: 0 }}>
            HHT AI Chat
          </Title>
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <Button type="primary" block onClick={handleNewChat} data-testid="new-chat">
            + New chat
          </Button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          {chats.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No chats yet"
              style={{ marginTop: 24 }}
            />
          ) : (
            <List
              dataSource={chats}
              renderItem={(chat) => (
                <List.Item
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  data-testid="chat-item"
                  style={{
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: chat.id === activeChatId ? '#fbeae8' : 'transparent',
                  }}
                >
                  <Text ellipsis style={{ width: '100%' }}>
                    {chat.title}
                  </Text>
                </List.Item>
              )}
            />
          )}
        </div>
        <div style={{ padding: 16, borderTop: '1px solid #f0f0f0' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            <Text type="secondary" ellipsis>
              {userName}
            </Text>
            <Button block onClick={handleLogout} data-testid="logout">
              Sign out
            </Button>
          </Space>
        </div>
      </Sider>

      <Layout>
        <Header
          style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', paddingInline: 24 }}
        >
          <Title level={5} style={{ margin: '16px 0' }} ellipsis>
            {activeTitle}
          </Title>
        </Header>

        <Content
          style={{ padding: 24, overflowY: 'auto', background: '#fafafa' }}
          data-testid="messages"
        >
          {loadingMessages ? (
            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <Spin />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ maxWidth: 760, margin: '48px auto 0', textAlign: 'center' }}>
              <Empty
                description={
                  <span>
                    Ask about HHT symptoms, lifestyle or treatment options.
                    <br />
                    This assistant provides general information, not medical advice.
                  </span>
                }
              />
            </div>
          ) : (
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              <div ref={listEndRef} />
            </div>
          )}
        </Content>

        <Footer style={{ background: '#fff', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 8 }}>
            <TextArea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              autoSize={{ minRows: 1, maxRows: 6 }}
              disabled={sending}
              data-testid="composer-input"
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
            />
            <Button
              type="primary"
              onClick={() => void handleSend()}
              loading={sending}
              disabled={!input.trim()}
              data-testid="send-button"
            >
              Send
            </Button>
          </div>
        </Footer>
      </Layout>
    </Layout>
  )
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      {!isUser && (
        <Avatar style={{ backgroundColor: '#c0392b', marginRight: 8, flexShrink: 0 }}>AI</Avatar>
      )}
      <div
        data-testid={isUser ? 'user-message' : 'assistant-message'}
        style={{
          maxWidth: '80%',
          padding: '10px 14px',
          borderRadius: 12,
          whiteSpace: 'pre-wrap',
          background: isUser ? '#c0392b' : '#fff',
          color: isUser ? '#fff' : 'inherit',
          border: isUser ? 'none' : '1px solid #f0f0f0',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}
