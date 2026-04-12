import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'
import { canManagePatients } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { buildCalendarMonthSummary } from '@/lib/calendar-read-model'

function parseYearMonth(searchParams: URLSearchParams) {
  const year = Number(searchParams.get('year'))
  const month = Number(searchParams.get('month'))

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  if (!canManagePatients(user.role) || !user.pharmacy_id) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const requestUrl = new URL(request.url)
  const parsed = parseYearMonth(requestUrl.searchParams)
  if (!parsed) {
    return NextResponse.json({ ok: false, error: 'invalid_year_month' }, { status: 400 })
  }

  const monthKey = `${parsed.year}-${String(parsed.month).padStart(2, '0')}`
  const monthStart = `${monthKey}-01`
  const monthEnd = new Date(parsed.year, parsed.month, 0)
  const monthEndKey = `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(monthEnd.getDate()).padStart(2, '0')}`

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('patient_day_tasks')
    .select('*')
    .eq('pharmacy_id', user.pharmacy_id)
    .gte('flow_date', monthStart)
    .lte('flow_date', monthEndKey)
    .order('flow_date', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ ok: false, error: 'calendar_month_fetch_failed', details: error.message }, { status: 500 })
  }

  const summaries = buildCalendarMonthSummary({
    tasks: data ?? [],
    year: parsed.year,
    month: parsed.month,
  })

  return NextResponse.json({
    ok: true,
    year: parsed.year,
    month: parsed.month,
    summaries,
  })
}
