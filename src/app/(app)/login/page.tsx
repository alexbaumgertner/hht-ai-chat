import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/payload'
import { LoginForm } from './LoginForm'

export default async function LoginPage() {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (user) {
    redirect('/chat')
  }
  return <LoginForm />
}
