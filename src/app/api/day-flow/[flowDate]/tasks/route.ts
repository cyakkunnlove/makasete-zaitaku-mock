import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { canManagePatients } from '@/lib/patient-permissions'

export async function GET(_request: Request, { params }: { params: { flowDate: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatients(user.role) || !user.pharmacy_id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const [currentResult, historyResult] = await Promise.all([
    supabase
      .from('patient_day_tasks')
      .select('*')
      .eq('pharmacy_id', user.pharmacy_id)
      .eq('flow_date', params.flowDate)
      .order('sort_order', { ascending: true }),
    supabase
      .from('patient_day_tasks')
      .select('*')
      .eq('pharmacy_id', user.pharmacy_id)
      .lt('flow_date', params.flowDate)
      .gte('flow_date', `${params.flowDate.slice(0, 7)}-01`)
      .order('flow_date', { ascending: true })
      .order('sort_order', { ascending: true }),
  ])

  if (currentResult.error) {
    return NextResponse.json({ ok: false, error: 'day_flow_fetch_failed', details: currentResult.error.message }, { status: 500 })
  }

  if (historyResult.error) {
    return NextResponse.json({ ok: false, error: 'day_flow_history_fetch_failed', details: historyResult.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, tasks: currentResult.data ?? [], historyTasks: historyResult.data ?? [] })
}
