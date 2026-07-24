'use client'

import { Alert, Button, Grid, Typography } from 'antd'
import React, { useState } from 'react'

import { MEDICAL_DISCLAIMER } from '@/lib/ai/disclaimer'

type Props = {
  compact?: boolean
}

const SHORT_TITLE =
  'This AI assistant provides reference information only and does not replace a doctor.'

export function DisclaimerBanner({ compact }: Props) {
  const screens = Grid.useBreakpoint()
  const isCompact = compact ?? screens.md === false
  const [expanded, setExpanded] = useState(false)

  if (isCompact) {
    return (
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12, flexShrink: 0 }}
        title={
          <div>
            <Typography.Text style={{ fontSize: 13 }}>{SHORT_TITLE}</Typography.Text>
            {expanded ? (
              <Typography.Paragraph style={{ margin: '8px 0 0', fontSize: 12 }} type="secondary">
                {MEDICAL_DISCLAIMER}
              </Typography.Paragraph>
            ) : null}
            <Button
              type="link"
              size="small"
              style={{ padding: 0, height: 'auto', marginTop: 4 }}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show less' : 'Read full disclaimer'}
            </Button>
          </div>
        }
      />
    )
  }

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
      style={{ marginBottom: 16, flexShrink: 0 }}
    />
  )
}
