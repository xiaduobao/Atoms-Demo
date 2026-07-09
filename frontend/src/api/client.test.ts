import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  api,
  getStoredToken,
  parseApiError,
  parseSseDataLine,
  setToken,
  streamPost,
} from './client'

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => data,
    body: null,
  }
}

function sseResponse(chunks: string[], status = 200) {
  const encoder = new TextEncoder()
  let index = 0
  const body = new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]))
        index += 1
      } else {
        controller.close()
      }
    },
  })
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: async () => ({}),
    body,
  }
}

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

  it('stringifies detail objects', () => {
    expect(parseApiError({ detail: [{ msg: 'bad' }] }, 'fallback')).toBe('[{"msg":"bad"}]')
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

  it('returns null for invalid JSON', () => {
    expect(parseSseDataLine('data: not-json')).toBeNull()
  })
})

describe('token helpers', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('stores and reads token', () => {
    setToken('abc')
    expect(getStoredToken()).toBe('abc')
    setToken(null)
    expect(getStoredToken()).toBeNull()
  })
})

describe('api request', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('location', { href: '' })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('sends Authorization header when token present', async () => {
    const user = {
      id: '1',
      email: 'a@b.com',
      name: 'A',
      credits: 10,
      plan_tier: 'free',
      created_at: '2026-01-01',
    }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(user) as Response)

    setToken('tok')
    const me = await api.me()
    expect(me.email).toBe('a@b.com')
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    )
  })

  it('throws parsed API errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'BAD_REQUEST', message: 'Nope' } }, 400) as Response,
    )
    await expect(api.listProjects()).rejects.toThrow('Nope')
  })

  it('redirects to login on 401 for protected routes', async () => {
    setToken('bad')
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ detail: 'Unauthorized' }, 401) as Response)
    await expect(api.listProjects()).rejects.toThrow('Unauthorized')
    expect(getStoredToken()).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('does not redirect on /auth/me 401', async () => {
    setToken('bad')
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ detail: 'Unauthorized' }, 401) as Response)
    await expect(api.me()).rejects.toThrow('Unauthorized')
    expect(window.location.href).toBe('')
  })

  it('createProject sends POST body', async () => {
    const project = {
      id: 'p1',
      user_id: '1',
      name: 'My App',
      current_code: null,
      files_json: null,
      status: 'draft',
      pending_plan: null,
      thread_id: null,
      share_slug: null,
      is_public: false,
      deployed_at: null,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    }
    vi.mocked(fetch).mockResolvedValue(jsonResponse(project) as Response)
    const res = await api.createProject('My App')
    expect(res.name).toBe('My App')
    expect(fetch).toHaveBeenCalledWith(
      '/api/projects',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'My App' }) }),
    )
  })
})

describe('streamPost', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('location', { href: '' })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('dispatches SSE events', async () => {
    vi.mocked(fetch).mockResolvedValue(
      sseResponse([
        'data: {"type":"node_done","agent":"pm","content":"plan"}\n\n',
        'data: {"type":"await_approve"}\n\n',
      ]) as Response,
    )
    const events: string[] = []
    await streamPost('/projects/1/plan', { message: 'hi', race_mode: false }, (ev) => {
      events.push(ev.type as string)
    })
    expect(events).toEqual(['node_done', 'await_approve'])
  })

  it('buffers partial SSE lines across chunks', async () => {
    vi.mocked(fetch).mockResolvedValue(
      sseResponse(['data: {"type":"done","code":"<html', '></html>"}\n\n']) as Response,
    )
    const events: Record<string, unknown>[] = []
    await streamPost('/projects/1/generate', undefined, (ev) => events.push(ev))
    expect(events[0].code).toBe('<html></html>')
  })

  it('throws on stream error events', async () => {
    vi.mocked(fetch).mockResolvedValue(
      sseResponse(['data: {"type":"error","message":"LLM failed"}\n\n']) as Response,
    )
    await expect(streamPost('/projects/1/generate', undefined, () => {})).rejects.toThrow(
      'LLM failed',
    )
  })

  it('throws on HTTP errors before stream', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ error: { code: 'PAYMENT_REQUIRED', message: 'No credits' } }, 402) as Response,
    )
    await expect(streamPost('/projects/1/plan', { message: 'x' }, () => {})).rejects.toThrow(
      'No credits',
    )
  })

  it('handles 401 like request()', async () => {
    setToken('bad')
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, 401) as Response)
    await expect(streamPost('/projects/1/plan', { message: 'x' }, () => {})).rejects.toThrow(
      'Unauthorized',
    )
    expect(window.location.href).toBe('/login')
  })
})
