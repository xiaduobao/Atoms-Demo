import { describe, expect, it } from 'vitest'
import {
  getPreviewErrorMessage,
  getPreviewErrorReason,
  isPreviewRenderable,
  normalizePreviewCode,
  PREVIEW_ERROR_MARKER,
} from './previewUtils'

describe('previewUtils', () => {
  it('detects backend error marker', () => {
    const code = `<!DOCTYPE html><html><body>${PREVIEW_ERROR_MARKER}json_parse_failed --></body></html>`
    expect(getPreviewErrorReason(code)).toBe('json_parse_failed')
    expect(isPreviewRenderable(code)).toBe(false)
    expect(getPreviewErrorMessage(code)).toContain('JSON')
  })

  it('normalizes legacy json artifact with literal escapes', () => {
    const code = '<!DOCTYPE html><html><body>\\nEnterprise</body></html>'
    expect(normalizePreviewCode(code)).toBe('<!DOCTYPE html><html><body>\nEnterprise</body></html>')
    expect(getPreviewErrorReason(code)).toBeNull()
    expect(isPreviewRenderable(code)).toBe(true)
  })

  it('accepts valid html', () => {
    const code = '<!DOCTYPE html><html><body><h1>Hi</h1></body></html>'
    expect(isPreviewRenderable(code)).toBe(true)
  })
})
