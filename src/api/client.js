/**
 * Thin wrapper around fetch() for talking to the MicroMentor Python API.
 *
 * The React app only ever calls our own /api/* endpoints. It never sees the
 * Supabase URL or keys - those live in the backend's environment variables.
 * In development, Vite proxies /api to the local FastAPI server (see vite.config.js).
 * On Vercel, /api/* is routed to the Python serverless function (see vercel.json).
 */

const TOKEN_KEY = 'micromentor_token'

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable - session just won't survive a refresh */
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getStoredToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0)
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    let message = data.detail || `Request failed (${res.status})`
    // FastAPI validation errors come back as a list
    if (Array.isArray(message)) message = message.map((d) => d.msg).join(', ')
    if (res.status === 401 && token) {
      storeToken(null)
      window.dispatchEvent(new Event('micromentor:logout'))
    }
    throw new ApiError(message, res.status)
  }
  return data
}

export const api = {
  signup: (email, password) => request('/auth/signup', { method: 'POST', body: { email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  getProfile: () => request('/profile'),
  saveProfile: (profile) => request('/profile', { method: 'PUT', body: profile }),
  getMentors: () => request('/mentors'),
  getMentor: (id) => request(`/mentors/${encodeURIComponent(id)}`),
  getBookings: () => request('/bookings'),
  createBooking: (mentorId, slot) =>
    request('/bookings', { method: 'POST', body: { mentor_id: mentorId, slot } }),
  cancelBooking: (id) => request(`/bookings/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
