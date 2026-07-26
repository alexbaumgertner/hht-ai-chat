import { App } from 'antd'
import React from 'react'

import LoginForm from './LoginForm'

/**
 * Auth.js redirects failed sign-ins back to `/login` (see `pages` in auth.config.ts)
 * with an `error` query parameter.
 */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  NoEmailFromProvider:
    'That account did not share an email address. Add a verified email to your Facebook account, or sign in with an email code.',
  OAuthAccountNotLinked:
    'An account with this email already exists. Please sign in the way you did the first time.',
  AccessDenied: 'Access was denied by the provider.',
  Configuration: 'Social sign-in is not configured correctly. Please contact your care team.',
}

export default async function LoginRoute({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  const oauthError = error
    ? (OAUTH_ERROR_MESSAGES[error] ?? 'Could not sign in with that account. Please try again.')
    : null

  return (
    <App>
      <LoginForm oauthError={oauthError} />
    </App>
  )
}
