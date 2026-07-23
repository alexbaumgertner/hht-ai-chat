import React from 'react'

import { AntdProvider } from '@/components/AntdProvider'

import './styles.css'

export const metadata = {
  description: 'HHT patient educational AI chat',
  title: 'HHT AI Chat',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <AntdProvider>
          <main>{children}</main>
        </AntdProvider>
      </body>
    </html>
  )
}
