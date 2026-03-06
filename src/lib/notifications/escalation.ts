import type { NotificationChannel, NotificationEvent } from './types'

export interface EscalationStep {
  channel: NotificationChannel
  delayMinutes: number
  label: string
}

export interface EscalationRule {
  event: NotificationEvent
  label: string
  steps: EscalationStep[]
}

export const escalationRules: EscalationRule[] = [
  {
    event: 'sla.violated',
    label: 'SLA違反エスカレーション',
    steps: [
      { channel: 'push', delayMinutes: 0, label: '即時プッシュ通知' },
      { channel: 'line', delayMinutes: 0, label: '即時LINE通知' },
      { channel: 'phone', delayMinutes: 5, label: '5分後に電話' },
    ],
  },
  {
    event: 'assignment.timeout',
    label: 'アサインタイムアウトエスカレーション',
    steps: [
      { channel: 'push', delayMinutes: 0, label: '即時プッシュ通知' },
      { channel: 'line', delayMinutes: 0, label: '即時LINE (次の薬剤師)' },
      { channel: 'phone', delayMinutes: 5, label: '5分後に管理者へ電話' },
    ],
  },
  {
    event: 'handover.unconfirmed',
    label: '申し送り未確認エスカレーション',
    steps: [
      { channel: 'email', delayMinutes: 0, label: '翌朝9:00メール通知' },
      { channel: 'line', delayMinutes: 120, label: '2時間後LINE通知' },
      { channel: 'phone', delayMinutes: 240, label: '4時間後に電話' },
    ],
  },
  {
    event: 'request.priority_escalated',
    label: '優先度エスカレーション',
    steps: [
      { channel: 'push', delayMinutes: 0, label: '即時プッシュ通知' },
      { channel: 'line', delayMinutes: 0, label: '即時LINE通知' },
      { channel: 'phone', delayMinutes: 10, label: '10分後に電話' },
    ],
  },
]
