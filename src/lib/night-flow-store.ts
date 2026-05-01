/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CurrentUser } from '@/lib/auth'
import { getCurrentActorRole, getCurrentScope } from '@/lib/active-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/types/database'

export type NightCaseStatus = 'accepted' | 'in_progress' | 'completed' | 'pharmacy_confirmed' | 'cancelled'
export type NightBillingStatus = 'pending' | 'linked' | 'not_needed'
export type NightChannel = 'phone' | 'fax'
type HandoffResult = '対応済み' | '薬局スタッフ確認が必要'
type AttentionLevel = '通常' | '要確認'

type NightActor = {
  id: string
  displayName: string
  role: UserRole
  regionId: string | null
  pharmacyId: string | null
  operationUnitId: string | null
}

type DbRow = Record<string, any>

type NightActionPayload = {
  summary?: string
  handoffNote?: string
  handoffResult?: HandoffResult
  morningRequest?: string
  attentionLevel?: AttentionLevel
  isBillable?: boolean
}

function nowIso() {
  return new Date().toISOString()
}

function dateKey(value = new Date()) {
  return value.toISOString().slice(0, 10)
}

function getSupabase() {
  return createAdminClient() as any
}

function getActor(user: CurrentUser): NightActor {
  const scope = getCurrentScope(user)
  return {
    id: user.id,
    displayName: user.full_name,
    role: getCurrentActorRole(user) ?? user.role,
    regionId: scope.regionId,
    pharmacyId: scope.pharmacyId,
    operationUnitId: scope.operationUnitId,
  }
}

function isNightCaseVisible(actor: NightActor, requestCase: DbRow) {
  if (actor.role === 'system_admin') return true
  if ((actor.role === 'regional_admin' || actor.role === 'night_pharmacist') && actor.regionId) return requestCase.region_id === actor.regionId
  if ((actor.role === 'pharmacy_admin' || actor.role === 'pharmacy_staff') && actor.pharmacyId) return requestCase.source_pharmacy_id === actor.pharmacyId
  return false
}

function isFaxVisible(actor: NightActor, fax: DbRow) {
  if (actor.role === 'system_admin') return true
  if ((actor.role === 'regional_admin' || actor.role === 'night_pharmacist') && actor.regionId) return fax.region_id === actor.regionId
  return false
}

function canUpdateNightCase(actor: NightActor, requestCase: DbRow, action: string) {
  if (!isNightCaseVisible(actor, requestCase)) return false
  if (action === 'start' || action === 'complete') return actor.role === 'night_pharmacist'
  if (action === 'confirm' || action === 'connect_billing') return actor.role === 'pharmacy_admin' || actor.role === 'pharmacy_staff'
  return false
}

function toActorView(user: DbRow | null | undefined) {
  if (!user) return null
  return {
    id: user.id,
    displayName: user.full_name,
    role: user.role,
  }
}

function toPharmacyView(pharmacy: DbRow | null | undefined) {
  if (!pharmacy) return null
  return {
    id: pharmacy.id,
    regionId: pharmacy.region_id,
    name: pharmacy.name,
    phone: pharmacy.phone,
    fax: pharmacy.fax,
  }
}

function toPatientView(patient: DbRow | null | undefined, pharmacyRegionId?: string | null) {
  if (!patient) return null
  return {
    id: patient.id,
    pharmacyId: patient.pharmacy_id,
    regionId: pharmacyRegionId ?? null,
    fullName: patient.full_name,
    kana: patient.full_name,
    address: patient.address,
    phone: patient.phone,
    isBillable: patient.is_billable !== false,
    status: patient.status,
  }
}

function toFaxView(fax: DbRow | null | undefined) {
  if (!fax) return null
  return {
    id: fax.id,
    regionId: fax.region_id,
    receivedAt: fax.received_at,
    title: fax.title ?? 'FAX添付',
    attachmentUrl: fax.storage_path,
    linkedRequestCaseId: fax.linked_night_case_id,
    linkedByUserId: fax.linked_by_user_id,
    linkedAt: fax.linked_at,
    status: fax.status,
  }
}

function toNightCaseView(requestCase: DbRow, maps: { patients: Map<string, DbRow>; pharmacies: Map<string, DbRow>; users: Map<string, DbRow>; faxes: Map<string, DbRow> }) {
  const patient = requestCase.patient_id ? maps.patients.get(requestCase.patient_id) : null
  const pharmacy = requestCase.source_pharmacy_id ? maps.pharmacies.get(requestCase.source_pharmacy_id) : null
  const handledBy = requestCase.handled_by_user_id ? maps.users.get(requestCase.handled_by_user_id) : null
  const confirmedBy = requestCase.pharmacy_confirmed_by_user_id ? maps.users.get(requestCase.pharmacy_confirmed_by_user_id) : null
  const fax = maps.faxes.get(requestCase.id) ?? null
  const confirmedDate = typeof requestCase.pharmacy_confirmed_at === 'string' ? requestCase.pharmacy_confirmed_at.slice(0, 10) : null
  const today = dateKey()
  const isConfirmedToday = requestCase.status === 'pharmacy_confirmed' && confirmedDate === today
  const isHiddenFromDashboard = requestCase.status === 'pharmacy_confirmed' && Boolean(confirmedDate && confirmedDate !== today)

  return {
    id: requestCase.id,
    patientId: requestCase.patient_id,
    sourcePharmacyId: requestCase.source_pharmacy_id,
    regionId: requestCase.region_id,
    acceptedByUserId: requestCase.accepted_by_user_id,
    handledByUserId: requestCase.handled_by_user_id,
    acceptedChannel: requestCase.accepted_channel,
    acceptedAt: requestCase.accepted_at,
    status: requestCase.status,
    startedAt: requestCase.started_at,
    completedAt: requestCase.completed_at,
    summary: requestCase.summary,
    handoffNote: requestCase.handoff_note,
    handoffResult: requestCase.handoff_result,
    morningRequest: requestCase.morning_request,
    attentionLevel: requestCase.attention_level,
    pharmacyConfirmedAt: requestCase.pharmacy_confirmed_at,
    pharmacyConfirmedByUserId: requestCase.pharmacy_confirmed_by_user_id,
    billingLinkageStatus: requestCase.billing_linkage_status,
    billingLinkedAt: requestCase.billing_linked_at,
    billingLinkedByUserId: requestCase.billing_linked_by_user_id,
    displayDate: requestCase.display_date,
    createdAt: requestCase.created_at,
    updatedAt: requestCase.updated_at,
    patient: toPatientView(patient, pharmacy?.region_id ?? requestCase.region_id),
    pharmacy: toPharmacyView(pharmacy),
    handledBy: toActorView(handledBy),
    confirmedBy: toActorView(confirmedBy),
    fax: toFaxView(fax),
    isConfirmedToday,
    isHiddenFromDashboard,
  }
}

function buildSummary(cases: ReturnType<typeof toNightCaseView>[], faxes: ReturnType<typeof toFaxView>[]) {
  return {
    activeCount: cases.filter((item) => item.status === 'accepted' || item.status === 'in_progress' || item.status === 'completed').length,
    waitingConfirmationCount: cases.filter((item) => item.status === 'completed').length,
    confirmedTodayCount: cases.filter((item) => item.isConfirmedToday).length,
    hiddenConfirmedCount: cases.filter((item) => item.isHiddenFromDashboard).length,
    unlinkedFaxCount: faxes.filter((item) => item?.status === 'unlinked').length,
  }
}

async function insertWorkflowEvent(input: { actor: NightActor; organizationId: string; regionId?: string | null; pharmacyId?: string | null; eventType: string; entityType: string; entityId?: string | null; metadata?: Record<string, unknown> }) {
  const supabase = getSupabase()
  await supabase.from('workflow_events').insert({
    organization_id: input.organizationId,
    region_id: input.regionId ?? null,
    pharmacy_id: input.pharmacyId ?? null,
    actor_user_id: input.actor.id,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata_json: input.metadata ?? {},
  })
}

function mapById(rows: DbRow[]): Map<string, DbRow> {
  return new Map(rows.map((row) => [String(row.id), row]))
}

export async function listNightFlowData(user: CurrentUser) {
  const supabase = getSupabase()
  const actor = getActor(user)

  const [actorsResult, pharmaciesResult, patientsResult, casesResult, faxesResult] = await Promise.all([
    supabase.from('users').select('id,full_name,role,region_id,pharmacy_id,operation_unit_id').eq('organization_id', user.organization_id).eq('status', 'active').order('created_at', { ascending: true }),
    supabase.from('pharmacies').select('id,organization_id,region_id,name,phone,fax,status').eq('organization_id', user.organization_id).eq('status', 'active').order('name', { ascending: true }),
    supabase.from('patients').select('id,organization_id,pharmacy_id,full_name,address,phone,is_billable,status').eq('organization_id', user.organization_id).eq('status', 'active').order('full_name', { ascending: true }),
    supabase.from('night_request_cases').select('*').eq('organization_id', user.organization_id).order('accepted_at', { ascending: false }).limit(100),
    supabase.from('fax_attachments').select('*').eq('organization_id', user.organization_id).order('received_at', { ascending: false }).limit(100),
  ])

  for (const result of [actorsResult, pharmaciesResult, patientsResult, casesResult, faxesResult]) {
    if (result.error) throw result.error
  }

  const allPharmacies = pharmaciesResult.data ?? []
  const visiblePharmacies = allPharmacies.filter((pharmacy: DbRow) => {
    if (actor.role === 'system_admin') return true
    if ((actor.role === 'regional_admin' || actor.role === 'night_pharmacist') && actor.regionId) return pharmacy.region_id === actor.regionId
    if ((actor.role === 'pharmacy_admin' || actor.role === 'pharmacy_staff') && actor.pharmacyId) return pharmacy.id === actor.pharmacyId
    return false
  })
  const visiblePharmacyIds = new Set(visiblePharmacies.map((pharmacy: DbRow) => pharmacy.id))
  const pharmacyRegionById: Map<string, string | null> = new Map(allPharmacies.map((pharmacy: DbRow) => [String(pharmacy.id), typeof pharmacy.region_id === 'string' ? pharmacy.region_id : null]))

  const visiblePatients = (patientsResult.data ?? []).filter((patient: DbRow) => {
    if (actor.role === 'system_admin') return true
    return patient.pharmacy_id ? visiblePharmacyIds.has(patient.pharmacy_id) : false
  })

  const visibleCases = (casesResult.data ?? []).filter((requestCase: DbRow) => isNightCaseVisible(actor, requestCase))
  const visibleFaxes = (faxesResult.data ?? []).filter((fax: DbRow) => isFaxVisible(actor, fax))
  const linkedFaxesByCase: Map<string, DbRow> = new Map(visibleFaxes.filter((fax: DbRow) => fax.linked_night_case_id).map((fax: DbRow) => [String(fax.linked_night_case_id), fax]))
  const caseUserIds = new Set(visibleCases.flatMap((item: DbRow) => [item.handled_by_user_id, item.pharmacy_confirmed_by_user_id, item.accepted_by_user_id].filter(Boolean)))
  const userRows = (actorsResult.data ?? []).filter((item: DbRow) => caseUserIds.has(item.id) || item.id === actor.id)
  const maps = {
    patients: mapById(patientsResult.data ?? []),
    pharmacies: mapById(allPharmacies),
    users: mapById(userRows),
    faxes: linkedFaxesByCase,
  }
  const cases = visibleCases.map((item: DbRow) => toNightCaseView(item, maps))
  const faxes = visibleFaxes.map(toFaxView).filter(Boolean)

  const roles = new Set<UserRole>()
  const demoActors = (actorsResult.data ?? [])
    .filter((item: DbRow) => {
      if (roles.has(item.role)) return false
      roles.add(item.role)
      return true
    })
    .map((item: DbRow) => ({ id: item.id, displayName: item.full_name, role: item.role }))

  if (!demoActors.some((item: { role: UserRole }) => item.role === actor.role)) {
    demoActors.unshift({ id: actor.id, displayName: actor.displayName, role: actor.role })
  }

  return {
    actor,
    demoActors,
    pharmacies: visiblePharmacies.map(toPharmacyView).filter(Boolean),
    patients: visiblePatients.map((patient: DbRow) => toPatientView(patient, patient.pharmacy_id ? pharmacyRegionById.get(String(patient.pharmacy_id)) : null)).filter(Boolean),
    faxes,
    cases,
    visibleDashboardCases: cases.filter((item: any) => !item.isHiddenFromDashboard),
    summary: buildSummary(cases, faxes),
  }
}

export async function createNightCase(user: CurrentUser, payload: { pharmacyId?: string; patientId?: string; acceptedChannel?: NightChannel; summary?: string }) {
  const supabase = getSupabase()
  const actor = getActor(user)
  if (actor.role !== 'night_pharmacist') throw new Error('role_not_allowed')
  if (!actor.regionId) throw new Error('region_scope_required')
  if (!payload.pharmacyId) throw new Error('pharmacy_required')
  if (!payload.patientId) throw new Error('patient_required')

  const [{ data: pharmacy, error: pharmacyError }, { data: patient, error: patientError }] = await Promise.all([
    supabase.from('pharmacies').select('*').eq('organization_id', user.organization_id).eq('id', payload.pharmacyId).eq('region_id', actor.regionId).maybeSingle(),
    supabase.from('patients').select('*').eq('organization_id', user.organization_id).eq('id', payload.patientId).maybeSingle(),
  ])
  if (pharmacyError) throw pharmacyError
  if (patientError) throw patientError
  if (!pharmacy) throw new Error('pharmacy_out_of_scope')
  if (!patient) throw new Error('patient_not_found')
  if (patient.pharmacy_id !== pharmacy.id) throw new Error('patient_pharmacy_mismatch')

  const timestamp = nowIso()
  const { data: requestCase, error } = await supabase
    .from('night_request_cases')
    .insert({
      organization_id: user.organization_id,
      region_id: actor.regionId,
      source_pharmacy_id: pharmacy.id,
      patient_id: patient.id,
      accepted_by_user_id: actor.id,
      handled_by_user_id: actor.id,
      accepted_channel: payload.acceptedChannel ?? 'phone',
      accepted_at: timestamp,
      status: 'accepted',
      summary: payload.summary ?? '',
      handoff_result: '薬局スタッフ確認が必要',
      morning_request: '',
      attention_level: '通常',
      handoff_note: '',
      billing_linkage_status: 'pending',
      display_date: dateKey(new Date(timestamp)),
    })
    .select('*')
    .single()
  if (error) throw error

  await insertWorkflowEvent({ actor, organizationId: user.organization_id, regionId: actor.regionId, pharmacyId: pharmacy.id, eventType: 'request.started', entityType: 'night_request_case', entityId: requestCase.id, metadata: { acceptedChannel: payload.acceptedChannel ?? 'phone', patientId: patient.id } })

  const maps = { patients: mapById([patient]), pharmacies: mapById([pharmacy]), users: mapById([{ id: actor.id, full_name: actor.displayName, role: actor.role }]), faxes: new Map<string, DbRow>() }
  return toNightCaseView(requestCase, maps)
}

export async function linkFaxToNightCase(user: CurrentUser, faxId: string, requestCaseId: string) {
  const supabase = getSupabase()
  const actor = getActor(user)
  if (actor.role !== 'night_pharmacist') throw new Error('role_not_allowed')

  const [{ data: fax, error: faxError }, { data: requestCase, error: caseError }] = await Promise.all([
    supabase.from('fax_attachments').select('*').eq('organization_id', user.organization_id).eq('id', faxId).maybeSingle(),
    supabase.from('night_request_cases').select('*').eq('organization_id', user.organization_id).eq('id', requestCaseId).maybeSingle(),
  ])
  if (faxError) throw faxError
  if (caseError) throw caseError
  if (!fax) throw new Error('fax_not_found')
  if (!requestCase) throw new Error('request_case_not_found')
  if (!isFaxVisible(actor, fax) || !isNightCaseVisible(actor, requestCase)) throw new Error('out_of_scope')

  const timestamp = nowIso()
  const [{ data: updatedFax, error: updateFaxError }, { data: updatedCase, error: updateCaseError }] = await Promise.all([
    supabase.from('fax_attachments').update({ linked_night_case_id: requestCase.id, linked_by_user_id: actor.id, linked_at: timestamp, status: 'linked', updated_at: timestamp }).eq('organization_id', user.organization_id).eq('id', fax.id).select('*').single(),
    supabase.from('night_request_cases').update({ accepted_channel: 'fax', updated_at: timestamp }).eq('organization_id', user.organization_id).eq('id', requestCase.id).select('*').single(),
  ])
  if (updateFaxError) throw updateFaxError
  if (updateCaseError) throw updateCaseError

  await insertWorkflowEvent({ actor, organizationId: requestCase.organization_id, regionId: requestCase.region_id, pharmacyId: requestCase.source_pharmacy_id, eventType: 'fax.linked', entityType: 'fax_attachment', entityId: fax.id, metadata: { requestCaseId } })

  const maps = { patients: new Map<string, DbRow>(), pharmacies: new Map<string, DbRow>(), users: mapById([{ id: actor.id, full_name: actor.displayName, role: actor.role }]), faxes: new Map([[updatedCase.id, updatedFax]]) }
  return { fax: toFaxView(updatedFax), requestCase: toNightCaseView(updatedCase, maps) }
}

export async function updateNightCaseAction(user: CurrentUser, requestCaseId: string, action: string, payload: NightActionPayload) {
  const supabase = getSupabase()
  const actor = getActor(user)
  const { data: requestCase, error: caseError } = await supabase.from('night_request_cases').select('*').eq('organization_id', user.organization_id).eq('id', requestCaseId).maybeSingle()
  if (caseError) throw caseError
  if (!requestCase) throw new Error('request_case_not_found')
  if (!canUpdateNightCase(actor, requestCase, action)) throw new Error('role_not_allowed')

  const timestamp = nowIso()
  const update: DbRow = { updated_at: timestamp }
  let eventType = `night_case.${action}`

  if (action === 'start') {
    update.status = 'in_progress'
    update.started_at = requestCase.started_at ?? timestamp
    eventType = 'request.started'
  } else if (action === 'complete') {
    update.status = 'completed'
    update.completed_at = requestCase.completed_at ?? timestamp
    update.summary = payload.summary ?? requestCase.summary
    update.handoff_note = payload.handoffNote ?? requestCase.handoff_note
    update.handoff_result = payload.handoffResult ?? requestCase.handoff_result ?? '薬局スタッフ確認が必要'
    update.morning_request = payload.morningRequest ?? requestCase.morning_request ?? ''
    update.attention_level = payload.attentionLevel ?? requestCase.attention_level ?? '通常'
    eventType = 'request.completed'
  } else if (action === 'confirm') {
    update.status = 'pharmacy_confirmed'
    update.pharmacy_confirmed_at = timestamp
    update.pharmacy_confirmed_by_user_id = actor.id
    eventType = 'handoff.confirmed'
  } else if (action === 'connect_billing') {
    if (requestCase.status !== 'pharmacy_confirmed') throw new Error('case_not_confirmed')
    update.billing_linkage_status = payload.isBillable === false ? 'not_needed' : 'linked'
    update.billing_linked_at = timestamp
    update.billing_linked_by_user_id = actor.id
    eventType = 'billing.flagged'
  } else {
    throw new Error('action_not_allowed')
  }

  const { data: updatedCase, error: updateError } = await supabase.from('night_request_cases').update(update).eq('organization_id', user.organization_id).eq('id', requestCase.id).select('*').single()
  if (updateError) throw updateError

  if (action === 'complete') {
    await supabase.from('night_handoff_notes').insert({
      organization_id: requestCase.organization_id,
      night_case_id: requestCase.id,
      patient_id: requestCase.patient_id,
      pharmacy_id: requestCase.source_pharmacy_id,
      created_by_user_id: actor.id,
      handoff_result: update.handoff_result,
      morning_request: update.morning_request,
      attention_level: update.attention_level,
      content: update.handoff_note,
      selected_items_json: { source: 'night_flow_template' },
    })
  }

  if (action === 'confirm' && requestCase.source_pharmacy_id) {
    await supabase.from('pharmacy_confirmations').upsert({
      organization_id: requestCase.organization_id,
      night_case_id: requestCase.id,
      pharmacy_id: requestCase.source_pharmacy_id,
      confirmed_by_user_id: actor.id,
      confirmed_at: timestamp,
      billing_linkage_status: requestCase.billing_linkage_status ?? 'pending',
    }, { onConflict: 'night_case_id,pharmacy_id' })
  }

  await insertWorkflowEvent({ actor, organizationId: requestCase.organization_id, regionId: requestCase.region_id, pharmacyId: requestCase.source_pharmacy_id, eventType, entityType: 'night_request_case', entityId: requestCase.id, metadata: payload })

  const [patientResult, pharmacyResult, usersResult, faxResult] = await Promise.all([
    updatedCase.patient_id ? supabase.from('patients').select('*').eq('organization_id', user.organization_id).eq('id', updatedCase.patient_id).maybeSingle() : Promise.resolve({ data: null }),
    updatedCase.source_pharmacy_id ? supabase.from('pharmacies').select('*').eq('organization_id', user.organization_id).eq('id', updatedCase.source_pharmacy_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('users').select('id,full_name,role').eq('organization_id', user.organization_id).in('id', [updatedCase.handled_by_user_id, updatedCase.pharmacy_confirmed_by_user_id, actor.id].filter(Boolean)),
    supabase.from('fax_attachments').select('*').eq('organization_id', user.organization_id).eq('linked_night_case_id', updatedCase.id).maybeSingle(),
  ])

  const users = 'data' in usersResult ? usersResult.data ?? [] : []
  const maps = {
    patients: patientResult.data ? mapById([patientResult.data]) : new Map<string, DbRow>(),
    pharmacies: pharmacyResult.data ? mapById([pharmacyResult.data]) : new Map<string, DbRow>(),
    users: mapById(users),
    faxes: faxResult.data ? new Map([[updatedCase.id, faxResult.data]]) : new Map<string, DbRow>(),
  }
  return toNightCaseView(updatedCase, maps)
}
