// Notification event types for the system
// 30 notification events covering all major system actions

export type NotificationEventCategory =
  | 'request'
  | 'assignment'
  | 'sla'
  | 'handover'
  | 'billing'
  | 'shift'
  | 'pharmacy'
  | 'system'

export type NotificationEvent =
  // Request events
  | 'request.created'
  | 'request.status_changed'
  | 'request.fax_received'
  | 'request.cancelled'
  | 'request.priority_escalated'
  // Assignment events
  | 'assignment.created'
  | 'assignment.accepted'
  | 'assignment.declined'
  | 'assignment.timeout'
  | 'assignment.dispatched'
  | 'assignment.arrived'
  | 'assignment.completed'
  // SLA events
  | 'sla.violated'
  | 'sla.warning'
  | 'sla.recovered'
  // Handover events
  | 'handover.created'
  | 'handover.confirmed'
  | 'handover.unconfirmed'
  | 'handover.reminder'
  // Billing events
  | 'billing.generated'
  | 'billing.paid'
  | 'billing.overdue'
  | 'billing.reminder'
  // Shift events
  | 'shift.reminder'
  | 'shift.changed'
  | 'shift.unassigned'
  // Pharmacy events
  | 'pharmacy.forwarding_on'
  | 'pharmacy.forwarding_off'
  | 'pharmacy.forwarding_reminder'
  // System events
  | 'system.maintenance'

export type NotificationChannel = 'line' | 'email' | 'push' | 'phone'

export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed'

export interface NotificationEventConfig {
  event: NotificationEvent
  category: NotificationEventCategory
  label: string
  description: string
  defaultChannels: NotificationChannel[]
}

export const notificationEventConfigs: NotificationEventConfig[] = [
  // Request
  { event: 'request.created', category: 'request', label: '新規受電', description: '夜間依頼の新規受付時', defaultChannels: ['push', 'line'] },
  { event: 'request.status_changed', category: 'request', label: 'ステータス変更', description: '依頼ステータスが変更された時', defaultChannels: ['push'] },
  { event: 'request.fax_received', category: 'request', label: 'FAX受領', description: 'FAXが受信された時', defaultChannels: ['push'] },
  { event: 'request.cancelled', category: 'request', label: '依頼キャンセル', description: '依頼がキャンセルされた時', defaultChannels: ['push', 'line'] },
  { event: 'request.priority_escalated', category: 'request', label: '優先度エスカレーション', description: '依頼の優先度が引き上げられた時', defaultChannels: ['push', 'line', 'phone'] },
  // Assignment
  { event: 'assignment.created', category: 'assignment', label: 'アサイン通知', description: '薬剤師にアサインされた時', defaultChannels: ['line', 'push'] },
  { event: 'assignment.accepted', category: 'assignment', label: 'アサイン受諾', description: '薬剤師がアサインを受諾した時', defaultChannels: ['push'] },
  { event: 'assignment.declined', category: 'assignment', label: 'アサイン辞退', description: '薬剤師がアサインを辞退した時', defaultChannels: ['push', 'line'] },
  { event: 'assignment.timeout', category: 'assignment', label: 'アサインタイムアウト', description: 'アサイン応答がタイムアウトした時', defaultChannels: ['push', 'line', 'phone'] },
  { event: 'assignment.dispatched', category: 'assignment', label: '出動開始', description: '薬剤師が出動を開始した時', defaultChannels: ['push'] },
  { event: 'assignment.arrived', category: 'assignment', label: '現地到着', description: '薬剤師が患者宅に到着した時', defaultChannels: ['push'] },
  { event: 'assignment.completed', category: 'assignment', label: '対応完了', description: '薬剤師が対応を完了した時', defaultChannels: ['push', 'line'] },
  // SLA
  { event: 'sla.violated', category: 'sla', label: 'SLA違反', description: '15分以内の折返しSLAに違反した時', defaultChannels: ['line', 'push', 'phone'] },
  { event: 'sla.warning', category: 'sla', label: 'SLA警告', description: 'SLA違反まで残り5分の時', defaultChannels: ['push', 'line'] },
  { event: 'sla.recovered', category: 'sla', label: 'SLA回復', description: 'SLA違反状態から回復した時', defaultChannels: ['push'] },
  // Handover
  { event: 'handover.created', category: 'handover', label: '申し送り作成', description: '申し送りが新規作成された時', defaultChannels: ['email', 'line'] },
  { event: 'handover.confirmed', category: 'handover', label: '申し送り確認', description: '申し送りが確認された時', defaultChannels: ['push'] },
  { event: 'handover.unconfirmed', category: 'handover', label: '申し送り未確認', description: '申し送りが長時間未確認の時', defaultChannels: ['email', 'line'] },
  { event: 'handover.reminder', category: 'handover', label: '確認リマインド', description: '申し送り確認のリマインド', defaultChannels: ['email'] },
  // Billing
  { event: 'billing.generated', category: 'billing', label: '請求書発行', description: '月次請求書が生成された時', defaultChannels: ['email'] },
  { event: 'billing.paid', category: 'billing', label: '入金確認', description: '入金が確認された時', defaultChannels: ['email'] },
  { event: 'billing.overdue', category: 'billing', label: '支払い遅延', description: '支払い期限を超過した時', defaultChannels: ['email', 'line'] },
  { event: 'billing.reminder', category: 'billing', label: '支払いリマインド', description: '支払いリマインダー', defaultChannels: ['email'] },
  // Shift
  { event: 'shift.reminder', category: 'shift', label: 'シフトリマインド', description: '当番開始前のリマインダー', defaultChannels: ['line', 'push'] },
  { event: 'shift.changed', category: 'shift', label: 'シフト変更', description: 'シフトスケジュールが変更された時', defaultChannels: ['line', 'push'] },
  { event: 'shift.unassigned', category: 'shift', label: '未割当警告', description: 'シフトに薬剤師が未割当の時', defaultChannels: ['push', 'line'] },
  // Pharmacy
  { event: 'pharmacy.forwarding_on', category: 'pharmacy', label: '転送開始', description: '電話転送がONになった時', defaultChannels: ['push'] },
  { event: 'pharmacy.forwarding_off', category: 'pharmacy', label: '転送解除', description: '電話転送がOFFになった時', defaultChannels: ['push'] },
  { event: 'pharmacy.forwarding_reminder', category: 'pharmacy', label: '転送解除リマインド', description: '朝の転送解除リマインダー', defaultChannels: ['line'] },
  // System
  { event: 'system.maintenance', category: 'system', label: 'メンテナンス通知', description: 'システムメンテナンスのお知らせ', defaultChannels: ['email', 'push'] },
]

export const categoryLabels: Record<NotificationEventCategory, string> = {
  request: '依頼管理',
  assignment: 'アサイン',
  sla: 'SLA監視',
  handover: '申し送り',
  billing: '請求',
  shift: 'シフト',
  pharmacy: '加盟薬局',
  system: 'システム',
}
