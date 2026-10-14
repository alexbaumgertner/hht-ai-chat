'use client'

import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Input, Select, Space, Typography } from 'antd'
import React, { useEffect, useState } from 'react'

import { CHAT_TITLE_MAX_LENGTH } from '@/lib/chats/title'

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
  /** When set, patient can edit the conversation title in place. */
  onRename?: (title: string) => Promise<void> | void
  renaming?: boolean
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
  onRename,
  renaming,
}: Props) {
  const showPromptSelector = Boolean(prompts && onPromptChange)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)

  useEffect(() => {
    if (!editing) setDraft(title)
  }, [title, editing])

  const startEdit = () => {
    setDraft(title)
    setEditing(true)
  }

  const cancelEdit = () => {
    setDraft(title)
    setEditing(false)
  }

  const saveEdit = async () => {
    if (!onRename) return
    try {
      await onRename(draft)
      setEditing(false)
    } catch {
      // Keep edit mode open; onRename surfaces the error toast.
    }
  }

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
      {editing && onRename ? (
        <Space.Compact style={{ width: '100%', marginBottom: 12, flexShrink: 0 }}>
          <Input
            value={draft}
            maxLength={CHAT_TITLE_MAX_LENGTH}
            aria-label="Conversation title"
            onChange={(e) => setDraft(e.target.value)}
            onPressEnter={() => void saveEdit()}
            disabled={renaming}
          />
          <Button
            type="primary"
            icon={<CheckOutlined />}
            aria-label="Save title"
            loading={renaming}
            onClick={() => void saveEdit()}
          />
          <Button
            icon={<CloseOutlined />}
            aria-label="Cancel rename"
            disabled={renaming}
            onClick={cancelEdit}
          />
        </Space.Compact>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
            flexShrink: 0,
            minWidth: 0,
          }}
        >
          <Typography.Title
            level={4}
            style={{ margin: 0, flex: 1, minWidth: 0 }}
            ellipsis
          >
            {title}
          </Typography.Title>
          {onRename ? (
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label="Rename conversation"
              onClick={startEdit}
            />
          ) : null}
        </div>
      )}
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
