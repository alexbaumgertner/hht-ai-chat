'use client'

import { FacebookFilled } from '@ant-design/icons'
import { Alert, App, Button, Card, Divider, Form, Input, Typography } from 'antd'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

type SocialProvider = 'facebook'
type Step = 'email' | 'code'

type Props = {
  oauthError?: string | null
}

export default function LoginPage({ oauthError }: Props) {
  const router = useRouter()
  const { message } = App.useApp()
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null)

  const busy = requestLoading || verifyLoading || socialLoading !== null

  const onRequestCode = async (values: { email: string }) => {
    setRequestLoading(true)
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email }),
      })
      const data = (await res.json()) as { message?: string }

      if (!res.ok) {
        setError(data.message || 'Could not send a code. Please try again.')
        return
      }

      setEmail(values.email.trim().toLowerCase())
      setInfo(data.message || 'Check your email for a sign-in code.')
      setStep('code')
    } catch {
      setError('Unable to send a code. Please try again.')
    } finally {
      setRequestLoading(false)
    }
  }

  const onVerifyCode = async (values: { code: string }) => {
    setVerifyLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, code: values.code }),
      })

      const data = (await res.json()) as {
        user?: { role?: string }
        message?: string
      }

      if (!res.ok) {
        setError(data.message || 'Could not verify that code.')
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
      setError('Unable to verify the code. Please try again.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const onSocialSignIn = (provider: SocialProvider) => {
    setError(null)
    setSocialLoading(provider)
    void signIn(provider, { callbackUrl: '/' }).catch(() => {
      setError('Unable to reach the sign-in provider. Please try again.')
      setSocialLoading(null)
    })
  }

  const backToEmail = () => {
    setStep('email')
    setError(null)
    setInfo(null)
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
          Sign in with Facebook, or get a one-time code by email — no password to remember.
        </Typography.Paragraph>
        {visibleError ? (
          <Alert type="error" message={visibleError} style={{ marginBottom: 16 }} showIcon />
        ) : null}
        {info && !visibleError ? (
          <Alert type="success" message={info} style={{ marginBottom: 16 }} showIcon />
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Button
            block
            size="large"
            icon={<FacebookFilled />}
            loading={socialLoading === 'facebook'}
            disabled={busy && socialLoading !== 'facebook'}
            onClick={() => onSocialSignIn('facebook')}
          >
            Continue with Facebook
          </Button>
        </div>
        <Divider plain>
          <Typography.Text type="secondary">or</Typography.Text>
        </Divider>
        {step === 'email' ? (
          <Form layout="vertical" onFinish={(v) => void onRequestCode(v)} requiredMark={false}>
            <Form.Item
              label="Email"
              name="email"
              initialValue={email || undefined}
              rules={[
                { required: true, message: 'Email is required' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input autoComplete="email" size="large" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={requestLoading}
              disabled={busy && !requestLoading}
            >
              Send code
            </Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={(v) => void onVerifyCode(v)} requiredMark={false}>
            <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
              Enter the 6-digit code sent to <strong>{email}</strong>.
            </Typography.Paragraph>
            <Form.Item
              label="Code"
              name="code"
              rules={[
                { required: true, message: 'Enter the code from your email' },
                { pattern: /^\d{6}$/, message: 'Enter the 6-digit code' },
              ]}
            >
              <Input
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                size="large"
                placeholder="000000"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={verifyLoading}
              disabled={busy && !verifyLoading}
            >
              Verify and continue
            </Button>
            <Button
              type="link"
              block
              style={{ marginTop: 8 }}
              disabled={busy}
              onClick={backToEmail}
            >
              Use a different email
            </Button>
            <Button
              type="link"
              block
              disabled={busy}
              onClick={() => void onRequestCode({ email })}
            >
              Resend code
            </Button>
          </Form>
        )}
      </Card>
    </div>
  )
}
