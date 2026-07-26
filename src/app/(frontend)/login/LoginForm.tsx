'use client'

import { FacebookFilled } from '@ant-design/icons'
import { Alert, App, Button, Card, Divider, Form, Input, Typography } from 'antd'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type LoginValues = {
  email: string
  password: string
}

type SocialProvider = 'facebook'

type Props = {
  oauthError?: string | null
}

export default function LoginPage({ oauthError }: Props) {
  const router = useRouter()
  const { message } = App.useApp()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null)

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

  // Redirect to the home route so the existing role-based routing decides the destination.
  const onSocialSignIn = (provider: SocialProvider) => {
    setError(null)
    setSocialLoading(provider)
    void signIn(provider, { callbackUrl: '/' }).catch(() => {
      setError('Unable to reach the sign-in provider. Please try again.')
      setSocialLoading(null)
    })
  }

  const visibleError = error ?? oauthError

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
          Sign in with your social account, or with the account your care team created for you.
        </Typography.Paragraph>
        {visibleError ? (
          <Alert type="error" message={visibleError} style={{ marginBottom: 16 }} showIcon />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            block
            size="large"
            icon={<FacebookFilled />}
            loading={socialLoading === 'facebook'}
            disabled={loading || (socialLoading !== null && socialLoading !== 'facebook')}
            onClick={() => onSocialSignIn('facebook')}
          >
            Continue with Facebook
          </Button>
        </div>
        <Divider plain>
          <Typography.Text type="secondary">or</Typography.Text>
        </Divider>
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
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={loading}
            disabled={socialLoading !== null}
          >
            Sign in
          </Button>
        </Form>
      </Card>
    </div>
  )
}
