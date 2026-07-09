import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PreviewPanel } from './PreviewPanel'

describe('PreviewPanel', () => {
  it('shows error card instead of iframe for invalid preview', () => {
    const code =
      '<!DOCTYPE html><html><body><!-- atoms-preview-error:json_parse_failed --></body></html>'
    render(<PreviewPanel code={code} />)
    expect(screen.getByText('预览无法渲染')).toBeTruthy()
    expect(screen.queryByTitle('App Preview')).toBeNull()
  })

  it('renders iframe for valid html', () => {
    const code = '<!DOCTYPE html><html><body>Hi</body></html>'
    render(<PreviewPanel code={code} />)
    expect(screen.getByTitle('App Preview')).toBeTruthy()
  })
})
