import { cleanup, render, screen } from '@testing-library/react'
import { Grid } from 'antd'
import React, { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ChatShell } from '@/components/chat/ChatShell'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd')
  return {
    ...actual,
    Grid: {
      ...actual.Grid,
      useBreakpoint: vi.fn(),
    },
  }
})

const threads = [{ id: '1', title: 'First chat' }]

describe('ChatShell responsive layout', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(Grid.useBreakpoint).mockReset()
  })

  it('shows sidebar on desktop and hides the menu button', () => {
    vi.mocked(Grid.useBreakpoint).mockReturnValue({ md: true, xs: false, sm: true })

    render(
      createElement(ChatShell, {
        threads,
        used: 2,
        limit: 50,
        children: createElement('div', null, 'Chat body'),
      }),
    )

    expect(screen.getByText('HHT AI Chat')).toBeTruthy()
    expect(screen.getByText('New chat')).toBeTruthy()
    expect(screen.getByText('Messages this month: 2/50')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Open conversations' })).toBeNull()
    expect(screen.getByText('Chat body')).toBeTruthy()
  })

  it('hides sidebar on mobile and exposes a conversations drawer trigger', () => {
    vi.mocked(Grid.useBreakpoint).mockReturnValue({ md: false, xs: true, sm: true })

    render(
      createElement(ChatShell, {
        threads,
        used: 2,
        limit: 50,
        children: createElement('div', null, 'Chat body'),
      }),
    )

    expect(screen.getByText('HHT Chat')).toBeTruthy()
    expect(screen.getByText('2/50')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open conversations' })).toBeTruthy()
    expect(screen.getByLabelText('Log out')).toBeTruthy()
    expect(screen.queryByRole('complementary')).toBeNull()
  })
})
