'use client'

import { fetchWithGetRetry } from '@/lib/api-client'

type ClientCacheEntry<T> = {
  savedAt: number
  data: T
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function readClientCache<T>(key: string, maxAgeMs: number) {
  if (!canUseStorage()) return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as ClientCacheEntry<T>
    if (!entry || typeof entry.savedAt !== 'number') return null
    if (Date.now() - entry.savedAt > maxAgeMs) return null
    return entry.data
  } catch {
    return null
  }
}

export function writeClientCache<T>(key: string, data: T) {
  if (!canUseStorage()) return
  try {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {}
}

export async function fetchJsonWithClientCache<T>(input: {
  key: string
  url: string
  maxAgeMs: number
  onCached?: (data: T) => void
  onFresh?: (data: T) => void
  init?: RequestInit
}) {
  const cached = readClientCache<T>(input.key, input.maxAgeMs)
  if (cached) input.onCached?.(cached)

  const response = await fetchWithGetRetry(input.url, input.init)
  const data = await response.json().catch(() => null) as T | null
  if (!response.ok || !data) throw new Error('fetch_failed')
  writeClientCache(input.key, data)
  input.onFresh?.(data)
  return data
}
