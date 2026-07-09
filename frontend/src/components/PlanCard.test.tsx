import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlanCard } from './PlanCard'

describe('PlanCard', () => {
  it('renders plan and calls onApprove', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()
    render(<PlanCard plan="## Todo App" onApprove={onApprove} />)

    expect(screen.getByText('## Todo App')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Approve & Generate/i }))
    expect(onApprove).toHaveBeenCalledOnce()
  })

  it('shows loading state', () => {
    render(<PlanCard plan="plan" onApprove={vi.fn()} loading />)
    expect(screen.getByRole('button', { name: /Generating/i }).hasAttribute('disabled')).toBe(true)
  })
})
