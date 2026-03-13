import { supabase } from './supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`
  }
}

async function request(method, path, body) {
  const headers = await authHeaders()
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Erro desconhecido' }))
    throw new Error(err.detail || 'Request failed')
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Tags
  getTags: () => request('GET', '/api/tags'),
  createTag: (body) => request('POST', '/api/tags', body),
  deleteTag: (id) => request('DELETE', `/api/tags/${id}`),

  // Notes
  getNotes: (params = {}) => {
    const q = new URLSearchParams()
    if (params.q) q.set('q', params.q)
    if (params.tag_id) q.set('tag_id', params.tag_id)
    return request('GET', `/api/notes?${q}`)
  },
  createNote: (body) => request('POST', '/api/notes', body),
  updateNote: (id, body) => request('PUT', `/api/notes/${id}`, body),
  deleteNote: (id) => request('DELETE', `/api/notes/${id}`),

  // Events
  getEvents: (params = {}) => {
    const q = new URLSearchParams()
    if (params.q) q.set('q', params.q)
    if (params.tag_id) q.set('tag_id', params.tag_id)
    if (params.month) q.set('month', params.month)
    return request('GET', `/api/events?${q}`)
  },
  createEvent: (body) => request('POST', '/api/events', body),
  updateEvent: (id, body) => request('PUT', `/api/events/${id}`, body),
  deleteEvent: (id) => request('DELETE', `/api/events/${id}`),
}
