'use client'

import { App, Button, Card, Form, Input, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { loginSchema, type LoginInput } from '@/lib/validation/chat'

const { Title, Paragraph } = Typography

export function LoginForm() {
  const router = useRouter()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginInput) => {
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      message.error(parsed.error.issues[0]?.message ?? 'Please check your input')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!res.ok) {
        message.error('Invalid email or password')
        return
      }
      message.success('Welcome back')
      router.replace('/chat')
      router.refresh()
    } catch {
      message.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        padding: 16,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          HHT AI Chat
        </Title>
        <Paragraph type="secondary">Sign in to talk with the HHT assistant.</Paragraph>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false} disabled={loading}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Please enter your email' }]}
          >
            <Input type="email" placeholder="you@example.com" autoComplete="email" size="large" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              placeholder="Your password"
              autoComplete="current-password"
              size="large"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Sign in
            </Button>
          </Form.Item>
        </Form>
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
          Phase 1 uses email + password. VK ID, Yandex ID and email one-time passwords arrive in a
          later phase.
        </Paragraph>
      </Card>
    </div>
  )
}
