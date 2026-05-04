import { NextResponse } from 'next/server'

import { getCurrentActorRole } from '@/lib/active-role'
import { getCurrentUser, requireRecentReverification } from '@/lib/auth'
import { getScopedPharmacyId } from '@/lib/patient-permissions'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

const DEFAULT_MASTER_SETTINGS = {
  admin_owner_name: '未設定',
  contract_plan: '加盟店 / 夜間受託あり',
  emergency_route: 'リージョン管理者 受付',
  default_morning_note: '夜間申し送りは pharmacy_admin が朝一確認し、必要に応じて pharmacy_staff へ共有する。',
  workload_light_max: 4,
  workload_medium_max: 8,
  workload_first_visit_weight: 1.5,
  workload_in_progress_weight: 1.2,
  workload_distance_weight: 0.3,
}

function normalizeFullWidthAscii(value: string) {
  return value.replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)).replace(/　/g, ' ')
}

function normalizePhone(value: unknown) {
  if (typeof value !== 'string') return null
  const digits = normalizeFullWidthAscii(value).replace(/[^0-9]/g, '').slice(0, 11)
  return digits || null
}

function normalizeText(value: unknown, fallback: string) {
  return typeof value === 'string' ? value.trim() || fallback : fallback
}

function normalizeWeight(value: unknown, fallback: number) {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.max(0, Math.min(99, numeric))
}

function toSettings(row: Record<string, unknown>) {
  return {
    pharmacyName: typeof row.name === 'string' ? row.name : '',
    adminOwner: typeof row.admin_owner_name === 'string' ? row.admin_owner_name : DEFAULT_MASTER_SETTINGS.admin_owner_name,
    contractPlan: typeof row.contract_plan === 'string' ? row.contract_plan : DEFAULT_MASTER_SETTINGS.contract_plan,
    emergencyRoute: typeof row.emergency_route === 'string' ? row.emergency_route : DEFAULT_MASTER_SETTINGS.emergency_route,
    nightDelegationEnabled: row.night_delegation_enabled === true ? 'on' : 'off',
    forwardingPhone: typeof row.forwarding_phone === 'string' ? row.forwarding_phone : '',
    defaultMorningNote: typeof row.default_morning_note === 'string' ? row.default_morning_note : DEFAULT_MASTER_SETTINGS.default_morning_note,
    workload: {
      lightMax: String(row.workload_light_max ?? DEFAULT_MASTER_SETTINGS.workload_light_max),
      mediumMax: String(row.workload_medium_max ?? DEFAULT_MASTER_SETTINGS.workload_medium_max),
      firstVisitWeight: String(row.workload_first_visit_weight ?? DEFAULT_MASTER_SETTINGS.workload_first_visit_weight),
      inProgressWeight: String(row.workload_in_progress_weight ?? DEFAULT_MASTER_SETTINGS.workload_in_progress_weight),
      distanceWeight: String(row.workload_distance_weight ?? DEFAULT_MASTER_SETTINGS.workload_distance_weight),
    },
  }
}

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const scopedPharmacyId = getScopedPharmacyId(user)
  if (!actorRole || !['pharmacy_admin', 'pharmacy_staff'].includes(actorRole) || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('pharmacies')
    .select('name, admin_owner_name, contract_plan, emergency_route, night_delegation_enabled, forwarding_phone, default_morning_note, workload_light_max, workload_medium_max, workload_first_visit_weight, workload_in_progress_weight, workload_distance_weight')
    .eq('organization_id', user.organization_id)
    .eq('id', scopedPharmacyId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: 'pharmacy_settings_fetch_failed', details: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ ok: false, error: 'pharmacy_not_found' }, { status: 404 })

  return NextResponse.json({ ok: true, settings: toSettings(data as Record<string, unknown>) })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })

  const actorRole = getCurrentActorRole(user)
  const scopedPharmacyId = getScopedPharmacyId(user)
  if (actorRole !== 'pharmacy_admin' || !scopedPharmacyId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })
  }
  if (!(await requireRecentReverification(user))) {
    return NextResponse.json({ ok: false, error: 'reauth_required' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const workload = input.workload && typeof input.workload === 'object' ? input.workload as Record<string, unknown> : {}
  const forwardingPhone = normalizePhone(input.forwardingPhone)

  const payload = {
    name: normalizeText(input.pharmacyName, ''),
    admin_owner_name: normalizeText(input.adminOwner, DEFAULT_MASTER_SETTINGS.admin_owner_name),
    contract_plan: normalizeText(input.contractPlan, DEFAULT_MASTER_SETTINGS.contract_plan),
    emergency_route: normalizeText(input.emergencyRoute, DEFAULT_MASTER_SETTINGS.emergency_route),
    night_delegation_enabled: input.nightDelegationEnabled === 'on',
    forwarding_phone: forwardingPhone,
    default_morning_note: normalizeText(input.defaultMorningNote, DEFAULT_MASTER_SETTINGS.default_morning_note),
    workload_light_max: normalizeWeight(workload.lightMax, DEFAULT_MASTER_SETTINGS.workload_light_max),
    workload_medium_max: normalizeWeight(workload.mediumMax, DEFAULT_MASTER_SETTINGS.workload_medium_max),
    workload_first_visit_weight: normalizeWeight(workload.firstVisitWeight, DEFAULT_MASTER_SETTINGS.workload_first_visit_weight),
    workload_in_progress_weight: normalizeWeight(workload.inProgressWeight, DEFAULT_MASTER_SETTINGS.workload_in_progress_weight),
    workload_distance_weight: normalizeWeight(workload.distanceWeight, DEFAULT_MASTER_SETTINGS.workload_distance_weight),
    updated_at: new Date().toISOString(),
  }

  if (!payload.name) return NextResponse.json({ ok: false, error: 'required_fields_missing' }, { status: 400 })

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('pharmacies')
    .update(payload as never)
    .eq('organization_id', user.organization_id)
    .eq('id', scopedPharmacyId)
    .select('name, admin_owner_name, contract_plan, emergency_route, night_delegation_enabled, forwarding_phone, default_morning_note, workload_light_max, workload_medium_max, workload_first_visit_weight, workload_in_progress_weight, workload_distance_weight')
    .single()

  if (error) {
    return NextResponse.json({ ok: false, error: 'pharmacy_settings_save_failed', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, settings: toSettings(data as Record<string, unknown>) })
}
