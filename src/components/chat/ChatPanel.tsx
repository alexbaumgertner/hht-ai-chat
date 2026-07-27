'use client'

import { Select, Typography } from 'antd'
import React from 'react'

import { Composer } from './Composer'
import { MessageList, type ChatMessage } from './MessageList'

export type PromptOption = {
  id: number | string
  title: string
  isDefault: boolean
}

type Props = {
  title: string
  messages: ChatMessage[]
  streamingContent?: string
  overLimit?: boolean
  sending?: boolean
  onSend: (content: string) => Promise<void> | void
  prompts?: PromptOption[]
  selectedPromptId?: string | number | null
  onPromptChange?: (promptId: string | number) => void
  promptsLoading?: boolean
}

export function ChatPanel({
  title,
  messages,
  streamingContent,
  overLimit,
  sending,
  onSend,
  prompts,
  selectedPromptId,
  onPromptChange,
  promptsLoading,
}: Props) {
  const showPromptSelector = Boolean(prompts && onPromptChange)

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
        {showPromptSelector ? (
          <div style={{ marginBottom: 12, flexShrink: 0 }}>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              Assistant prompt
            </Typography.Text>
            <Select
              style={{ width: '100%' }}
              loading={promptsLoading}
              value={selectedPromptId != null ? String(selectedPromptId) : undefined}
              placeholder="Select a prompt"
              options={(prompts ?? []).map((p) => ({
                value: String(p.id),
                label: p.isDefault ? `${p.title} (default)` : p.title,
              }))}
              onChange={(value) => {
                const match = (prompts ?? []).find((p) => String(p.id) === value)
                if (match) onPromptChange?.(match.id)
              }}
            />
          </div>
        ) : null}
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
