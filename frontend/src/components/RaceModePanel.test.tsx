import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RaceModePanel } from './RaceModePanel'

const variants = [
  {
    id: 'v1',
    project_id: 'p1',
    variant_index: 0,
    style_label: 'Minimal Clean',
    preview_html: '<html><body>v1</body></html>',
    files_json: null,
    created_at: '2026-01-01',
  },
  {
    id: 'v2',
    project_id: 'p1',
    variant_index: 1,
    style_label: 'Bold Modern',
    preview_html: '<html><body>v2</body></html>',
    files_json: null,
    created_at: '2026-01-01',
  },
]

describe('RaceModePanel', () => {
  it('returns null when no variants', () => {
    const { container } = render(<RaceModePanel variants={[]} onSelect={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders variants and selects one', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<RaceModePanel variants={variants} onSelect={onSelect} />)

    expect(screen.getByText('Minimal Clean')).toBeTruthy()
    expect(screen.getByText('Bold Modern')).toBeTruthy()

    const buttons = screen.getAllByRole('button', { name: /Select this design/i })
    await user.click(buttons[1])
    expect(onSelect).toHaveBeenCalledWith('v2')
  })
})
