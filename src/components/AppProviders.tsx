'use client'

import { ConfigProvider, theme } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import type { PropsWithChildren } from 'react'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ConfigProvider
      locale={ruRU}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          borderRadius: 10,
          colorPrimary: '#1677ff',
          fontFamily: 'Arial, Helvetica, sans-serif',
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
