import { AntdRegistry } from '@ant-design/nextjs-registry'
import React from 'react'

import { AppProviders } from '@/components/AppProviders'

import './styles.css'

export const metadata = {
  description: 'Информационный AI-помощник для людей с HHT.',
  title: 'HHT помощник',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="ru">
      <body>
        <AntdRegistry>
          <AppProviders>
            <main>{children}</main>
          </AppProviders>
        </AntdRegistry>
      </body>
    </html>
  )
}
