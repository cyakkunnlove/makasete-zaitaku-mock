export type UserRole = 'system_admin' | 'regional_admin' | 'pharmacy_admin' | 'night_pharmacist' | 'pharmacy_staff'
export type RequestStatus =
  | 'received' | 'fax_pending' | 'fax_received' | 'assigning'
  | 'assigned' | 'checklist' | 'dispatched' | 'arrived'
  | 'in_progress' | 'completed' | 'cancelled'
export type RequestPriority = 'high' | 'normal' | 'low'
export type AssignmentResponse = 'accepted' | 'declined' | 'timeout'
export type ShiftType = 'primary' | 'backup'
export type OrganizationStatus = 'active' | 'suspended' | 'archived'
export type RegionStatus = 'active' | 'suspended' | 'archived'
export type OperationUnitKind = 'night_ops' | 'regional_ops' | 'pharmacy_ops'
export type OperationUnitStatus = 'active' | 'suspended' | 'archived'
export type PharmacyStatus = 'pending' | 'active' | 'suspended' | 'terminated'
export type ForwardingStatus = 'on' | 'off'
export type ForwardingMode = 'manual_on' | 'manual_off' | 'auto'
export type BillingStatus = 'unpaid' | 'paid' | 'overdue'
export type PatientStatus = 'active' | 'inactive' | 'incomplete'
export type PatientGeocodeStatus = 'pending' | 'success' | 'failed' | 'stale'
export type PatientGeocodeSource = 'google_maps' | 'manual'
export type PatientHomePhotoType = 'outside' | 'entrance' | 'parking' | 'landmark' | 'other'
export type NotificationChannel = 'line' | 'phone' | 'sms' | 'email' | 'push' | 'app'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'responded' | 'failed' | 'expired'
export type ChecklistType = 'initial' | 'routine' | 'emergency'

export interface Organization {
  id: string
  code: string | null
  name: string
  legal_name: string | null
  status: OrganizationStatus
  created_at: string
  updated_at: string
}

export interface Region {
  id: string
  organization_id: string
  code: string
  name: string
  status: RegionStatus
  created_at: string
  updated_at: string
}

export interface OperationUnit {
  id: string
  organization_id: string
  region_id: string
  code: string
  name: string
  kind: OperationUnitKind
  status: OperationUnitStatus
  created_at: string
  updated_at: string
}

export interface Pharmacy {
  id: string
  organization_id: string
  region_id: string
  code: string
  name: string
  address: string | null
  phone: string | null
  fax: string | null
  forwarding_phone: string | null
  forwarding_status: ForwardingStatus
  forwarding_mode: ForwardingMode
  forwarding_auto_start: string | null
  forwarding_auto_end: string | null
  forwarding_updated_by_name: string | null
  forwarding_updated_at: string | null
  status: PharmacyStatus
  night_delegation_enabled: boolean
  contract_start_date: string | null
  contract_end_date: string | null
  created_at: string
  updated_at: string
}

export type UserStatus = 'invited' | 'active' | 'suspended' | 'disabled'
export type AccountInvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired'

export interface User {
  id: string
  cognito_sub: string | null
  organization_id: string
  pharmacy_id: string | null
  region_id: string | null
  operation_unit_id: string | null
  role: UserRole
  full_name: string
  phone: string | null
  email: string
  line_user_id: string | null
  is_active: boolean
  status: UserStatus
  last_login_at: string | null
  last_reverified_at: string | null
  created_at: string
  updated_at: string
}

export interface UserRoleAssignment {
  id: string
  user_id: string
  organization_id: string
  role: UserRole
  region_id: string | null
  pharmacy_id: string | null
  operation_unit_id: string | null
  is_default: boolean
  is_active: boolean
  granted_by: string | null
  granted_at: string
  revoked_at: string | null
  created_at: string
  updated_at: string
}

export interface AccountInvitation {
  id: string
  organization_id: string
  invited_user_id: string
  role: UserRole
  email: string
  region_id: string | null
  pharmacy_id: string | null
  operation_unit_id: string | null
  token_hash: string
  status: AccountInvitationStatus
  expires_at: string
  sent_at: string | null
  last_sent_at: string | null
  accepted_at: string | null
  revoked_at: string | null
  created_by: string | null
  message_id: string | null
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  organization_id: string | null
  pharmacy_id: string | null
  medical_institution_id?: string | null
  doctor_master_id?: string | null
  full_name: string
  date_of_birth: string | null
  address: string
  phone: string | null
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relation: string | null
  doctor_name: string | null
  doctor_clinic: string | null
  doctor_night_phone: string | null
  medical_history: string | null
  allergies: string | null
  current_medications: string | null
  visit_notes: string | null
  insurance_info: string | null
  disease_name: string | null
  is_billable?: boolean | null
  billing_exclusion_reason?: string | null
  risk_score: number
  requires_multi_visit: boolean
  status: PatientStatus
  latitude?: number | null
  longitude?: number | null
  geocode_status?: PatientGeocodeStatus | null
  geocoded_at?: string | null
  geocode_source?: PatientGeocodeSource | null
  geocode_error?: string | null
  geocode_input_address?: string | null
  created_at: string
  updated_at: string
}

export interface MedicalInstitution {
  id: string
  organization_id: string
  region_id: string | null
  pharmacy_id: string | null
  name: string
  kana: string | null
  phone: string | null
  fax: string | null
  postal_code: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface DoctorMaster {
  id: string
  organization_id: string
  medical_institution_id: string
  full_name: string
  kana: string | null
  department: string | null
  phone: string | null
  notes: string | null
  is_active: boolean
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

export interface PatientHomePhoto {
  id: string
  patient_id: string
  storage_path: string
  photo_type: PatientHomePhotoType | null
  caption: string | null
  sort_order: number
  taken_at: string | null
  uploaded_by: string | null
  uploaded_at: string
  deleted_by: string | null
  deleted_at: string | null
  delete_reason: string | null
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  organization_id: string | null
  pharmacy_id: string | null
  patient_id: string | null
  received_at: string
  priority: RequestPriority
  status: RequestStatus
  triage_symptom: string | null
  triage_vitals_change: string | null
  triage_consciousness: string | null
  triage_urgency: string | null
  fax_received_at: string | null
  fax_image_url: string | null
  first_callback_at: string | null
  sla_met: boolean | null
  notes: string | null
  completed_at: string | null
  timeline_events: TimelineEvent[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  request_id: string
  pharmacist_id: string | null
  assigned_at: string
  responded_at: string | null
  response: AssignmentResponse | null
  timeout_minutes: number
  dispatched_at: string | null
  arrived_at: string | null
  completed_at: string | null
  travel_distance_km: number | null
  travel_mode: string | null
  is_multi_visit: boolean
  created_at: string
}

export interface Checklist {
  id: string
  request_id: string
  assignment_id: string
  checklist_type: ChecklistType
  items: ChecklistItem[]
  completed_at: string | null
  created_at: string
}

export interface ChecklistItem {
  label: string
  checked: boolean
  checked_at?: string
}

export interface Handover {
  id: string
  request_id: string | null
  assignment_id: string | null
  pharmacist_id: string | null
  pharmacy_id: string | null
  patient_id: string | null
  situation: string | null
  background: string | null
  assessment: string | null
  recommendation: string | null
  vitals: VitalsData | null
  medication_administered: string | null
  patient_condition: string | null
  free_text: string | null
  confirmed_by: string | null
  confirmed_at: string | null
  reminder_sent_at: string | null
  report_file_url: string | null
  reminder_count: number
  created_at: string
  updated_at: string
}

export interface TimelineEvent {
  status: RequestStatus
  timestamp: string
  user_name: string
  note?: string
}

export interface VitalsData {
  blood_pressure?: string
  pulse?: number
  temperature?: number
  spo2?: number
  respiration_rate?: number
}

export interface ShiftSchedule {
  id: string
  organization_id: string | null
  pharmacist_id: string | null
  shift_date: string
  shift_type: ShiftType
  created_at: string
}

export interface Billing {
  id: string
  organization_id: string | null
  pharmacy_id: string | null
  billing_month: string
  saas_fee: number
  night_fee: number
  total_fee: number
  tax_amount: number
  status: BillingStatus
  invoiced_at: string | null
  paid_at: string | null
  created_at: string
}

export interface PatientVisitRuleRow {
  id: string
  patient_id: string | null
  pattern: 'weekly' | 'biweekly' | 'custom'
  weekday: number | null
  interval_weeks: number
  anchor_week: number | null
  preferred_time: string | null
  monthly_visit_limit: number
  active: boolean
  custom_dates: string[] | null
  excluded_dates: string[] | null
  created_at: string
  updated_at: string
}

export interface PatientDayTask {
  id: string
  organization_id: string | null
  pharmacy_id: string | null
  patient_id: string | null
  flow_date: string
  sort_order: number
  scheduled_time: string
  visit_type: '定期' | '臨時' | '要確認'
  source: '自動生成' | '手動追加'
  status: 'scheduled' | 'in_progress' | 'completed'
  planning_status: 'unplanned' | 'planned'
  planned_by: string | null
  planned_by_id: string | null
  planned_at: string | null
  handled_by: string | null
  handled_by_id: string | null
  handled_at: string | null
  completed_at: string | null
  billable: boolean
  collection_status: '未着手' | '請求準備OK' | '回収中' | '入金済'
  amount: number
  note: string
  updated_by_id: string | null
  updated_at: string
  created_at: string
}

export interface AuditLog {
  id: string
  organization_id: string | null
  pharmacy_id?: string | null
  region_id?: string | null
  operation_unit_id?: string | null
  user_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

export interface NotificationLog {
  id: string
  organization_id: string | null
  notification_type: string
  channel: NotificationChannel
  recipient_id: string | null
  recipient_contact: string | null
  trigger_entity: string | null
  trigger_id: string | null
  status: NotificationStatus
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  responded_at: string | null
  response_data: Record<string, unknown> | null
  error_message: string | null
  retry_count: number
  next_retry_at: string | null
  created_at: string
}

// Supabase Database type (for client typing)
export interface Database {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization>; Update: Partial<Organization> }
      regions: { Row: Region; Insert: Partial<Region>; Update: Partial<Region> }
      pharmacies: { Row: Pharmacy; Insert: Partial<Pharmacy>; Update: Partial<Pharmacy> }
      operation_units: { Row: OperationUnit; Insert: Partial<OperationUnit>; Update: Partial<OperationUnit> }
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> }
      user_role_assignments: { Row: UserRoleAssignment; Insert: Partial<UserRoleAssignment>; Update: Partial<UserRoleAssignment> }
      account_invitations: { Row: AccountInvitation; Insert: Partial<AccountInvitation>; Update: Partial<AccountInvitation> }
      patients: { Row: Patient; Insert: Partial<Patient>; Update: Partial<Patient> }
      medical_institutions: { Row: MedicalInstitution; Insert: Partial<MedicalInstitution>; Update: Partial<MedicalInstitution> }
      doctor_masters: { Row: DoctorMaster; Insert: Partial<DoctorMaster>; Update: Partial<DoctorMaster> }
      requests: { Row: Request; Insert: Partial<Request>; Update: Partial<Request> }
      assignments: { Row: Assignment; Insert: Partial<Assignment>; Update: Partial<Assignment> }
      checklists: { Row: Checklist; Insert: Partial<Checklist>; Update: Partial<Checklist> }
      handovers: { Row: Handover; Insert: Partial<Handover>; Update: Partial<Handover> }
      shift_schedules: { Row: ShiftSchedule; Insert: Partial<ShiftSchedule>; Update: Partial<ShiftSchedule> }
      patient_visit_rules: { Row: PatientVisitRuleRow; Insert: Partial<PatientVisitRuleRow>; Update: Partial<PatientVisitRuleRow> }
      patient_day_tasks: { Row: PatientDayTask; Insert: Partial<PatientDayTask>; Update: Partial<PatientDayTask> }
      patient_home_photos: { Row: PatientHomePhoto; Insert: Partial<PatientHomePhoto>; Update: Partial<PatientHomePhoto> }
      billings: { Row: Billing; Insert: Partial<Billing>; Update: Partial<Billing> }
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
      notification_logs: { Row: NotificationLog; Insert: Partial<NotificationLog>; Update: Partial<NotificationLog> }
    }
  }
}
