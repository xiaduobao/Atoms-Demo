import type { CodeVersion, Message, Project, RaceVariant, SharedProject, User } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE || '/api'

export function getStoredToken(): string | null {
  return localStorage.getItem('atoms_token')
}

function getToken(): string | null {
  return getStoredToken()
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('atoms_token', token)
  else localStorage.removeItem('atoms_token')
}

export function parseApiError(err: unknown, fallback: string): string {
  if (typeof err !== 'object' || err === null) return fallback
  const body = err as Record<string, unknown>
  const nested = body.error
  if (typeof nested === 'object' && nested !== null) {
    const message = (nested as Record<string, unknown>).message
    if (typeof message === 'string') return message
  }
  if (typeof body.detail === 'string') return body.detail
  if (body.detail !== undefined) return JSON.stringify(body.detail)
  return fallback
}

function handleUnauthorized(path: string): void {
  setToken(null)
  const isAuthProbe = path === '/auth/me' || path.endsWith('/auth/me')
  if (!isAuthProbe) {
    window.location.href = '/login'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })
  if (res.status === 401) {
    handleUnauthorized(path)
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(parseApiError(err, res.statusText))
  }
  return res.json()
}

export const api = {
  register: (email: string, password: string, name: string) =>
    request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<User>('/auth/me'),

  listProjects: () => request<Project[]>('/projects'),

  createProject: (name: string) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify({ name }) }),

  getProject: (id: string) => request<Project>(`/projects/${id}`),

  updateProject: (id: string, name: string) =>
    request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  deleteProject: (id: string) =>
    request<{ status: string }>(`/projects/${id}`, { method: 'DELETE' }),

  listMessages: (projectId: string) => request<Message[]>(`/projects/${projectId}/messages`),

  listVersions: (projectId: string) => request<CodeVersion[]>(`/projects/${projectId}/versions`),

  restoreVersion: (projectId: string, versionId: string) =>
    request<CodeVersion>(`/projects/${projectId}/versions/${versionId}/restore`, {
      method: 'POST',
    }),

  deploy: (projectId: string) =>
    request<{ share_url: string; share_slug: string }>(`/projects/${projectId}/deploy`, {
      method: 'POST',
    }),

  race: (projectId: string) =>
    request<RaceVariant[]>(`/projects/${projectId}/race`, { method: 'POST' }),

  selectRace: (projectId: string, variantId: string) =>
    request<Project>(`/projects/${projectId}/race/select?variant_id=${variantId}`, {
      method: 'POST',
    }),

  purchase: (planTier: 'pro' | 'enterprise') =>
    request<User>('/credits/purchase', {
      method: 'POST',
      body: JSON.stringify({ plan_tier: planTier }),
    }),

  getShared: (slug: string) => request<SharedProject>(`/share/${slug}`),
}

export function parseSseDataLine(line: string): Record<string, unknown> | null {
  if (!line.startsWith('data: ')) return null
  try {
    return JSON.parse(line.slice(6)) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function streamPost(
  path: string,
  body: unknown | undefined,
  onEvent: (event: Record<string, unknown>) => void,
) {
  const token = getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    handleUnauthorized(path)
    throw new Error('Unauthorized')
  }
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}))
    throw new Error(parseApiError(err, 'Stream failed'))
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      const event = parseSseDataLine(line)
      if (!event) continue
      if (event.type === 'error') {
        const message = typeof event.message === 'string' ? event.message : 'Stream error'
        throw new Error(message)
      }
      onEvent(event)
    }
  }
}
