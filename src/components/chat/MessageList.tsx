'use client'

import { Empty, Typography } from 'antd'
import React, { useEffect, useRef } from 'react'

export type ChatMessage = {
  id?: string | number
  role: 'user' | 'assistant' | 'system'
  content: string
}

type Props = {
  messages: ChatMessage[]
  streamingContent?: string
}

const bubbleTextStyle: React.CSSProperties = {
  margin: 0,
  color: 'inherit',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
}

export function MessageList({ messages, streamingContent }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (messages.length === 0 && !streamingContent) {
    return (
      <Empty
        description="Ask a question about HHT symptoms, tests, treatment, or lifestyle."
        style={{ marginTop: 48 }}
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
      {messages.map((message, index) => {
        const isUser = message.role === 'user'
        return (
          <div
            key={message.id ?? `${message.role}-${index}`}
            style={{
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: isUser ? '#1a5f4a' : '#f4f6f5',
              color: isUser ? '#fff' : '#1a1a1a',
              padding: '10px 14px',
              borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
            }}
          >
            <Typography.Paragraph style={bubbleTextStyle}>{message.content}</Typography.Paragraph>
          </div>
        )
      })}
      {streamingContent ? (
        <div
          style={{
            alignSelf: 'flex-start',
            maxWidth: '85%',
            background: '#f4f6f5',
            padding: '10px 14px',
            borderRadius: '12px 12px 12px 4px',
          }}
        >
          <Typography.Paragraph style={{ ...bubbleTextStyle, color: undefined }}>
            {streamingContent}
          </Typography.Paragraph>
        </div>
      ) : null}
      <div ref={bottomRef} />
    </div>
  )
}
