'use client'

import { Alert } from 'antd'
import React from 'react'

import { MEDICAL_DISCLAIMER } from '@/lib/ai/disclaimer'

export function DisclaimerBanner() {
  return (
    <Alert
      type="info"
      showIcon
      title={`Обратите внимание: данный ИИ-ассистент предоставляет исключительно 
        справочную информацию и не заменяет консультацию врача. 
        Ответы бота не являются медицинским диагнозом или назначением лечения. 
        При появлении острых симптомов, обильном кровотечении или ухудшении 
        самочувствия незамедлительно обратитесь за медицинской помощью или вызовите скорую службу`}
      description={MEDICAL_DISCLAIMER}
      style={{ marginBottom: 16 }}
    />
  )
}
