import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { canManagePatients } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { buildCalendarDayDetail } from '@/lib/calendar-read-model'

const PATIENT_LIST_SELECT = 'id, full_name'

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function GET(_request: Request, { params }: { params: { date: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatients(user.role) || !user.pharmacy_id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  if (!isDateKey(params.date)) {
    return NextResponse.json({ ok: false, error: 'invalid_date' }, { status: 400 })
  }

  const monthStart = `${params.date.slice(0, 7)}-01`
  const supabase = createServerSupabaseClient()

  const [taskResult, patientResult] = await Promise.all([
    supabase
      .from('patient_day_tasks')
      .select('*')
      .eq('pharmacy_id', user.pharmacy_id)
      .gte('flow_date', monthStart)
      .lte('flow_date', params.date)
      .order('flow_date', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase
      .from('patients')
      .select(PATIENT_LIST_SELECT)
      .eq('pharmacy_id', user.pharmacy_id),
  ])

  if (taskResult.error) {
    return NextResponse.json({ ok: false, error: 'calendar_day_fetch_failed', details: taskResult.error.message }, { status: 500 })
  }

  if (patientResult.error) {
    return NextResponse.json({ ok: false, error: 'calendar_patient_fetch_failed', details: patientResult.error.message }, { status: 500 })
  }

  const patients = (patientResult.data ?? []) as Array<{ id: string; full_name: string }>
  const patientsById = new Map(patients.map((patient) => [patient.id, patient]))
  const detail = buildCalendarDayDetail({
    tasks: taskResult.data ?? [],
    date: params.date,
    canEditPast: user.role === 'pharmacy_admin',
    patientsById,
  })

  return NextResponse.json({ ok: true, detail })
}
