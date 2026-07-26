import { App } from 'antd'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { isPatient } from '@/access'
import config from '@/payload.config'
import type { User } from '@/payload-types'

import ChatHomeClient from './ChatHomeClient'

export default async function ChatPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  const patient = user as User

  if (!isPatient(patient)) {
    redirect('/admin')
  }

  return (
    <App>
      <ChatHomeClient
        user={{ email: patient.email, name: patient.name, image: patient.image }}
      />
    </App>
  )
}
