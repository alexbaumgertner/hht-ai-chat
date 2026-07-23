'use client'

import { Alert, App, Button, Card, Form, Input, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type LoginValues = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const { message } = App.useApp()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginValues) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      })

      const data = (await res.json()) as {
        user?: { role?: string }
        errors?: Array<{ message?: string }>
        message?: string
      }

      if (!res.ok) {
        setError(data.errors?.[0]?.message || data.message || 'Login failed')
        return
      }

      if (data.user?.role === 'admin') {
        message.info('Admins use the Payload admin panel.')
        window.location.href = '/admin'
        return
      }

      router.push('/chat')
      router.refresh()
    } catch {
      setError('Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(160deg, #e8f0ec 0%, #f7f5f0 55%, #eef2f0 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }} variant="borderless">
        <Typography.Title level={2} style={{ marginTop: 0, color: '#1a5f4a' }}>
          HHT AI Chat
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Sign in with the account your care team created for you.
        </Typography.Paragraph>
        {error ? (
          <Alert type="error" message={error} style={{ marginBottom: 16 }} showIcon />
        ) : null}
        <Form layout="vertical" onFinish={(v) => void onFinish(v)} requiredMark={false}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input autoComplete="email" size="large" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password autoComplete="current-password" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  )
}
