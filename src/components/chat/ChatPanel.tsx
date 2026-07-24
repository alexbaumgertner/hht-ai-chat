'use client'

import { Typography } from 'antd'
import React from 'react'

import { Composer } from './Composer'
import { MessageList, type ChatMessage } from './MessageList'

type Props = {
  title: string
  messages: ChatMessage[]
  streamingContent?: string
  overLimit?: boolean
  sending?: boolean
  onSend: (content: string) => Promise<void> | void
}

export function ChatPanel({
  title,
  messages,
  streamingContent,
  overLimit,
  sending,
  onSend,
}: Props) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 12, flexShrink: 0 }}>
        {title}
      </Typography.Title>
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          border: '1px solid #dde3df',
          padding: 16,
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', marginBottom: 12 }}>
          <MessageList messages={messages} streamingContent={streamingContent} />
        </div>
        {overLimit ? (
          <Typography.Text type="danger" style={{ marginBottom: 8, flexShrink: 0 }}>
            You have reached your monthly message limit. Please check back next month.
          </Typography.Text>
        ) : null}
        <div style={{ flexShrink: 0 }}>
          <Composer disabled={overLimit} loading={sending} onSend={onSend} />
        </div>
      </div>
    </div>
  )
}
