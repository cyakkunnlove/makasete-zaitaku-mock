'use client'

type FetchRetryOptions = {
  retries?: number
  retryDelayMs?: number
  retryStatuses?: number[]
  redirectOnUnauthorized?: boolean
}

const DEFAULT_RETRY_STATUSES = [408, 429, 500, 502, 503, 504]

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function getMethod(init?: RequestInit) {
  return (init?.method ?? 'GET').toUpperCase()
}

export async function fetchWithGetRetry(input: RequestInfo | URL, init?: RequestInit, options: FetchRetryOptions = {}) {
  const method = getMethod(init)
  if (method !== 'GET') return fetch(input, init)

  const retries = options.retries ?? 2
  const retryDelayMs = options.retryDelayMs ?? 300
  const retryStatuses = new Set(options.retryStatuses ?? DEFAULT_RETRY_STATUSES)
  let lastError: unknown = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(input, init)
      if (response.status === 401 && options.redirectOnUnauthorized !== false && typeof window !== 'undefined') {
        window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
        return response
      }
      if (!retryStatuses.has(response.status) || attempt === retries) return response
    } catch (error) {
      lastError = error
      if (attempt === retries) throw error
    }

    await wait(retryDelayMs * (attempt + 1))
  }

  throw lastError instanceof Error ? lastError : new Error('fetch_retry_failed')
}

export async function fetchJsonWithGetRetry<T>(input: RequestInfo | URL, init?: RequestInit, options?: FetchRetryOptions) {
  const response = await fetchWithGetRetry(input, init, options)
  const data = await response.json().catch(() => null) as T | null
  return { response, data }
}
