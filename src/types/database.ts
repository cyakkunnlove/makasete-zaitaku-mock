export type UserRole = 'system_admin' | 'regional_admin' | 'pharmacy_admin' | 'day_pharmacist' | 'night_pharmacist' | 'pharmacy_staff'
export type RequestStatus =
  | 'received' | 'fax_pending' | 'fax_received' | 'assigning'
  | 'assigned' | 'checklist' | 'dispatched' | 'arrived'
  | 'in_progress' | 'completed' | 'cancelled'
export type RequestPriority = 'high' | 'normal' | 'low'
export type AssignmentResponse = 'accepted' | 'declined' | 'timeout'
export type ShiftType = 'primary' | 'backup'
export type PharmacyStatus = 'pending' | 'active' | 'suspended' | 'terminated'
export type ForwardingStatus = 'on' | 'off'
export type BillingStatus = 'unpaid' | 'paid' | 'overdue'
export type PatientStatus = 'active' | 'inactive' | 'incomplete'
export type NotificationChannel = 'line' | 'phone' | 'sms' | 'email' | 'push' | 'app'
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'responded' | 'failed' | 'expired'
export type ChecklistType = 'initial' | 'routine' | 'emergency'

export interface Organization {
  id: string
  name: string
  legal_name: string | null
  phone: string | null
  address: string | null
  night_start: string
  night_end: string
  sla_target_minutes: number
  created_at: string
  updated_at: string
}

export interface Pharmacy {
  id: string
  organization_id: string
  name: string
  area: string | null
  address: string
  phone: string
  fax: string | null
  forwarding_phone: string | null
  forwarding_status: ForwardingStatus
  contract_date: string | null
  saas_monthly_fee: number
  night_monthly_fee: number
  status: PharmacyStatus
  patient_count: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  organization_id: string | null
  pharmacy_id: string | null
  role: UserRole
  full_name: string
  phone: string | null
  email: string | null
  line_user_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  organization_id: string | null
  pharmacy_id: string | null
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
  risk_score: number
  requires_multi_visit: boolean
  status: PatientStatus
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

export interface AuditLog {
  id: string
  organization_id: string | null
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
      pharmacies: { Row: Pharmacy; Insert: Partial<Pharmacy>; Update: Partial<Pharmacy> }
      users: { Row: User; Insert: Partial<User>; Update: Partial<User> }
      patients: { Row: Patient; Insert: Partial<Patient>; Update: Partial<Patient> }
      requests: { Row: Request; Insert: Partial<Request>; Update: Partial<Request> }
      assignments: { Row: Assignment; Insert: Partial<Assignment>; Update: Partial<Assignment> }
      checklists: { Row: Checklist; Insert: Partial<Checklist>; Update: Partial<Checklist> }
      handovers: { Row: Handover; Insert: Partial<Handover>; Update: Partial<Handover> }
      shift_schedules: { Row: ShiftSchedule; Insert: Partial<ShiftSchedule>; Update: Partial<ShiftSchedule> }
      billings: { Row: Billing; Insert: Partial<Billing>; Update: Partial<Billing> }
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
      notification_logs: { Row: NotificationLog; Insert: Partial<NotificationLog>; Update: Partial<NotificationLog> }
    }
  }
}
