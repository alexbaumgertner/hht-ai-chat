'use client'

import { Alert } from 'antd'
import React from 'react'

import { MEDICAL_DISCLAIMER } from '@/lib/ai/disclaimer'

export function DisclaimerBanner() {
  return (
    <Alert
      type="info"
      showIcon
      title="Educational information only"
      description={MEDICAL_DISCLAIMER}
      style={{ marginBottom: 16 }}
    />
  )
}
