'use client'

import { RobotOutlined, SendOutlined, StopOutlined, UserOutlined } from '@ant-design/icons'
import { useChat } from '@ai-sdk/react'
import { Alert, Avatar, Button, Card, Flex, Input, Space, Spin, Tag, Typography } from 'antd'
import { DefaultChatTransport } from 'ai'
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

import { chatMessageSchema } from '@/lib/chat/schema'

import styles from './ChatShell.module.css'

const SUGGESTIONS = [
  'Как подготовиться к приёму у врача?',
  'Что важно знать о носовых кровотечениях при HHT?',
  'Какие вопросы задать о дефиците железа?',
]

export function ChatShell() {
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/chat' }), [])
  const { error, messages, sendMessage, status, stop } = useChat({ transport })
  const [input, setInput] = useState('')
  const [validationError, setValidationError] = useState<string>()
  const endRef = useRef<HTMLDivElement>(null)
  const isBusy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const submitText = (value: string) => {
    const parsedMessage = chatMessageSchema.safeParse(value)

    if (!parsedMessage.success) {
      setValidationError('Введите сообщение длиной до 4000 символов.')
      return
    }

    setValidationError(undefined)
    setInput('')
    void sendMessage({ text: parsedMessage.data })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isBusy) {
      submitText(input)
    }
  }

  const handlePressEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()

      if (!isBusy) {
        submitText(input)
      }
    }
  }

  return (
    <section className={styles.shell} aria-labelledby="chat-title">
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>HHT помощник</div>
          <Typography.Title id="chat-title" level={1}>
            Понятные ответы о жизни с HHT
          </Typography.Title>
          <p className={styles.subtitle}>
            Задайте вопрос о симптомах, образе жизни или подготовке к разговору с врачом. Помощник
            даёт справочную информацию, а не медицинские назначения.
          </p>
        </header>

        <Card className={styles.chatCard} styles={{ body: { padding: 0 } }}>
          <div className={styles.messages} aria-live="polite" aria-busy={isBusy}>
            {messages.length === 0 ? (
              <div className={styles.welcome}>
                <Avatar size={52} icon={<RobotOutlined />} />
                <Typography.Title level={3}>С чего начнём?</Typography.Title>
                <Typography.Paragraph type="secondary">
                  Опишите вопрос своими словами или выберите пример. Не указывайте ФИО, контакты и
                  другие лишние персональные данные.
                </Typography.Paragraph>
                <Flex wrap="wrap" gap="small" className={styles.suggestions}>
                  {SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion}
                      disabled={isBusy}
                      onClick={() => submitText(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </Flex>
              </div>
            ) : (
              messages.map((message) => {
                const text = message.parts
                  .filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('')

                if (!text) return null

                const isUser = message.role === 'user'

                return (
                  <article
                    className={`${styles.message} ${isUser ? styles.userMessage : ''}`}
                    key={message.id}
                    aria-label={isUser ? 'Ваше сообщение' : 'Ответ помощника'}
                  >
                    <Avatar
                      icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                      style={isUser ? { backgroundColor: '#1677ff' } : undefined}
                    />
                    <div className={styles.bubble}>
                      <p className={styles.messageText}>{text}</p>
                    </div>
                  </article>
                )
              })
            )}
            {status === 'submitted' && (
              <Space>
                <Spin size="small" />
                <Typography.Text type="secondary">Помощник думает…</Typography.Text>
              </Space>
            )}
            <div ref={endRef} />
          </div>

          <form className={styles.composer} onSubmit={handleSubmit}>
            {(validationError || error) && (
              <Alert
                className={styles.error}
                type="error"
                showIcon
                title={
                  validationError ?? 'Не удалось получить ответ. Проверьте соединение и повторите.'
                }
              />
            )}
            <div className={styles.composerRow}>
              <Input.TextArea
                className={styles.input}
                aria-label="Сообщение помощнику"
                autoSize={{ minRows: 2, maxRows: 6 }}
                disabled={isBusy}
                maxLength={4_000}
                onChange={(event) => setInput(event.target.value)}
                onPressEnter={handlePressEnter}
                placeholder="Например: что обсудить с врачом при частых носовых кровотечениях?"
                value={input}
              />
              {status === 'streaming' ? (
                <Button icon={<StopOutlined />} onClick={() => void stop()}>
                  Остановить
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={status === 'submitted'}
                  disabled={!input.trim()}
                >
                  Отправить
                </Button>
              )}
            </div>
            <div className={styles.helper}>
              <span>Enter — отправить, Shift + Enter — новая строка</span>
              <Tag color="blue">Справочная информация</Tag>
            </div>
          </form>
        </Card>

        <Alert
          className={styles.safety}
          type="warning"
          showIcon
          title="При сильном кровотечении или резком ухудшении самочувствия обратитесь за неотложной помощью."
        />
      </div>
    </section>
  )
}
