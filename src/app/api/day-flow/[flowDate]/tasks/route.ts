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
  const { data, error } = await supabase
    .from('patient_day_tasks')
    .select('*')
    .eq('pharmacy_id', user.pharmacy_id)
    .eq('flow_date', params.flowDate)
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ ok: false, error: 'day_flow_fetch_failed', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, tasks: data ?? [] })
}
