import { describe, expect, it } from 'vitest'
import { parseApiError, parseSseDataLine } from './client'

describe('parseApiError', () => {
  it('reads unified error envelope', () => {
    expect(
      parseApiError({ error: { code: 'NOT_FOUND', message: 'Project not found' } }, 'fallback'),
    ).toBe('Project not found')
  })

  it('falls back to FastAPI detail string', () => {
    expect(parseApiError({ detail: 'Invalid email or password' }, 'fallback')).toBe(
      'Invalid email or password',
    )
  })

  it('uses fallback for unknown shapes', () => {
    expect(parseApiError(null, 'fallback')).toBe('fallback')
  })
})

describe('parseSseDataLine', () => {
  it('parses SSE data lines', () => {
    expect(parseSseDataLine('data: {"type":"done","code":"<html/>"}')).toEqual({
      type: 'done',
      code: '<html/>',
    })
  })

  it('returns null for non-data lines', () => {
    expect(parseSseDataLine('event: message')).toBeNull()
  })
})
