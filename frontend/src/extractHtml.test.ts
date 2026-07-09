import { describe, expect, it } from 'vitest'

function extractHtml(text: string): string {
  const t = text.trim()
  if (t.toLowerCase().startsWith('<!doctype html') || t.toLowerCase().startsWith('<html')) return t
  const m = t.match(/```(?:html)?\s*(<!DOCTYPE html[\s\S]*?)```/i)
  return m ? m[1].trim() : t
}

describe('extractHtml', () => {
  it('extracts html from markdown fence', () => {
    const raw = '```html\n<!DOCTYPE html><html></html>\n```'
    expect(extractHtml(raw)).toContain('<!DOCTYPE html>')
  })
})
