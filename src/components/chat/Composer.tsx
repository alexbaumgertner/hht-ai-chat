'use client'

import { Button, Grid, Input, Space } from 'antd'
import React, { useState } from 'react'

type Props = {
  disabled?: boolean
  loading?: boolean
  placeholder?: string
  onSend: (content: string) => Promise<void> | void
}

export function Composer({ disabled, loading, placeholder, onSend }: Props) {
  const [value, setValue] = useState('')
  const screens = Grid.useBreakpoint()
  const isMobile = screens.md === false

  const submit = async () => {
    const content = value.trim()
    if (!content || disabled || loading) return
    setValue('')
    await onSend(content)
  }

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input.TextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder || 'Ask about HHT...'}
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={disabled || loading}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault()
            void submit()
          }
        }}
      />
      <Button
        type="primary"
        size={isMobile ? 'large' : 'middle'}
        loading={loading}
        disabled={disabled || !value.trim()}
        onClick={() => void submit()}
      >
        Send
      </Button>
    </Space.Compact>
  )
}
