import { cleanup, render, screen } from '@testing-library/react'
import React, { createElement } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { MessageList } from '@/components/chat/MessageList'

describe('MessageList markdown rendering', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => undefined
  })

  afterEach(() => {
    cleanup()
  })

  it('renders assistant markdown as headings, bold text, and links', () => {
    render(
      createElement(MessageList, {
        messages: [
          {
            id: '1',
            role: 'assistant',
            content: '# Heading\n\nThis has **bold** and a [link](https://example.com).',
          },
        ],
      }),
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Heading' })).toBeTruthy()
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    const link = screen.getByRole('link', { name: 'link' })
    expect(link.getAttribute('href')).toBe('https://example.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('keeps user messages as plain text without markdown parsing', () => {
    render(
      createElement(MessageList, {
        messages: [
          {
            id: '2',
            role: 'user',
            content: 'Please explain **not bold**',
          },
        ],
      }),
    )

    expect(screen.getByText('Please explain **not bold**')).toBeTruthy()
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.queryByText('not bold', { selector: 'strong' })).toBeNull()
  })
})
