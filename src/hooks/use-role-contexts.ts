'use client'

import { useCallback, useEffect, useState } from 'react'
import type { UserRole } from '@/types/database'

export type RoleContextItem = {
  assignmentId: string
  role: UserRole
  regionName: string | null
  pharmacyName: string | null
  operationUnitName: string | null
  isDefault: boolean
  isActive: boolean
}

export function useRoleContexts() {
  const [assignments, setAssignments] = useState<RoleContextItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/role-contexts', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'role_context_load_failed')
      }
      setAssignments(data.assignments ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'role_context_load_failed')
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const selectAssignment = useCallback(async (assignmentId: string) => {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/active-role-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      })
      const data = await response.json()
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'role_context_save_failed')
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'role_context_save_failed')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    assignments,
    loading,
    saving,
    error,
    reload: load,
    selectAssignment,
  }
}
