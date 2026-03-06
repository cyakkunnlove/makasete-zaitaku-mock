import type { NotificationChannel } from './types'

export interface ChannelConfig {
  id: NotificationChannel
  label: string
  description: string
  icon: string // lucide icon name
  color: string
  enabled: boolean
}

export const channelConfigs: ChannelConfig[] = [
  {
    id: 'line',
    label: 'LINE',
    description: 'LINE Messaging APIによるプッシュメッセージ',
    icon: 'MessageCircle',
    color: 'text-green-400',
    enabled: true,
  },
  {
    id: 'email',
    label: 'メール',
    description: 'Resendによるメール送信',
    icon: 'Mail',
    color: 'text-sky-400',
    enabled: true,
  },
  {
    id: 'push',
    label: 'プッシュ通知',
    description: 'ブラウザ・アプリ内プッシュ通知',
    icon: 'Bell',
    color: 'text-amber-400',
    enabled: true,
  },
  {
    id: 'phone',
    label: '電話',
    description: 'Twilioによる音声電話エスカレーション',
    icon: 'Phone',
    color: 'text-rose-400',
    enabled: false,
  },
]

export const channelStatusClass: Record<string, string> = {
  active: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  inactive: 'border-gray-500/40 bg-gray-500/20 text-gray-400',
  error: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
}
