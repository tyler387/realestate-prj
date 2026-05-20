import { tokenStorage } from './authService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081'

export type SavedTradeFilter = {
  id: number
  name: string
  payload: string
  createdAt: string
  updatedAt: string
}

const authHeaders = () => {
  const token = tokenStorage.get()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 204) return undefined as T

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || '요청에 실패했습니다.')
  }

  return response.json() as Promise<T>
}

export const tradeFilterApi = {
  list: () => request<SavedTradeFilter[]>('/api/v1/trades/filters'),
  create: (name: string, payload: string) =>
    request<SavedTradeFilter>('/api/v1/trades/filters', {
      method: 'POST',
      body: JSON.stringify({ name, payload }),
    }),
  update: (id: number, name: string, payload: string) =>
    request<SavedTradeFilter>(`/api/v1/trades/filters/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, payload }),
    }),
  remove: (id: number) =>
    request<void>(`/api/v1/trades/filters/${id}`, {
      method: 'DELETE',
    }),
}
