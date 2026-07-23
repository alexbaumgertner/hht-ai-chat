'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry'
import { ConfigProvider } from 'antd'
import React from 'react'

const theme = {
  token: {
    colorPrimary: '#1a5f4a',
    colorInfo: '#1a5f4a',
    borderRadius: 6,
    fontFamily:
      '"Source Sans 3", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  },
}

export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>{children}</ConfigProvider>
    </AntdRegistry>
  )
}
