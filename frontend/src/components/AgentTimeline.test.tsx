import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentTimeline } from './AgentTimeline'

describe('AgentTimeline', () => {
  it('marks completed and active agents', () => {
    render(<AgentTimeline activeAgent="pm" completed={['researcher']} />)
    expect(screen.getByText(/Researcher/).textContent).toContain('✓')
    expect(screen.getByText(/PM/).textContent).toContain('…')
    expect(screen.getByText(/Engineer/)).toBeTruthy()
  })
})
