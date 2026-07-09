import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentMessage, TypingIndicator } from './AgentMessage'

const baseMessage = {
  id: '1',
  project_id: 'p1',
  role: 'assistant' as const,
  agent_type: 'pm',
  content: 'Build plan ready',
  created_at: '2026-01-01',
}

describe('AgentMessage', () => {
  it('renders assistant message with agent badge', () => {
    render(<AgentMessage message={baseMessage} />)
    expect(screen.getByText('Build plan ready')).toBeTruthy()
    expect(screen.getByText(/Emma/)).toBeTruthy()
  })

  it('renders user bubble', () => {
    render(
      <AgentMessage
        message={{ ...baseMessage, role: 'user', agent_type: null, content: 'Make a todo app' }}
      />,
    )
    expect(screen.getByText('Make a todo app')).toBeTruthy()
  })
})

describe('TypingIndicator', () => {
  it('shows typing dots for engineer by default', () => {
    const { container } = render(<TypingIndicator />)
    expect(container.querySelectorAll('.typing-dot')).toHaveLength(3)
  })
})
