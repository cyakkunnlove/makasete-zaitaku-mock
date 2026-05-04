'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Bell, MessageCircle, Mail, Phone, Save,
  Shield, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  notificationSettingsData,
  type NotificationSettingItem,
} from '@/lib/mock-data'
import { escalationRules } from '@/lib/notifications/escalation'

const channelHeaders = [
  { key: 'line' as const, label: 'LINE', icon: <MessageCircle size={14} /> },
  { key: 'email' as const, label: 'メール', icon: <Mail size={14} /> },
  { key: 'push' as const, label: 'プッシュ', icon: <Bell size={14} /> },
  { key: 'phone' as const, label: '電話', icon: <Phone size={14} /> },
]

export default function NotificationSettingsPage() {
  const { role } = useAuth()
  const isAdmin = role === 'regional_admin' || role === 'pharmacy_admin'
  const [settings, setSettings] = useState<NotificationSettingItem[]>(notificationSettingsData)
  const [toast, setToast] = useState<string | null>(null)
  const [expandedEscalation, setExpandedEscalation] = useState<string | null>(null)

  const categories = Array.from(new Set(settings.map(s => s.category)))

  const toggleChannel = (event: string, channel: 'line' | 'email' | 'push' | 'phone') => {
    if (!isAdmin) return
    setSettings(prev => prev.map(s =>
      s.event === event ? { ...s, [channel]: !s[channel] } : s
    ))
  }

  const handleSave = () => {
    setToast('通知設定を保存しました')
    setTimeout(() => setToast(null), 3000)
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 text-slate-900">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Shield size={16} />
          この画面は リージョン管理者 または 薬局管理者 のみ確認できます
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fade-in-up fixed top-20 right-4 z-50 rounded-lg bg-emerald-600/90 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">通知設定</h1>
          <p className="mt-1 text-sm text-slate-600">イベントごとの通知手段を設定します</p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleSave}
            className="press-squish focus-ring bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save size={16} className="mr-2" />
            保存
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Shield size={16} />
          通知設定の編集にはAdmin権限が必要です
        </div>
      )}

      {/* Event x Channel Matrix */}
      {categories.map(category => {
        const categorySettings = settings.filter(s => s.category === category)
        return (
          <Card key={category} className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-0">
              <div className="border-b border-slate-200 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">{category}</h3>
              </div>

              {/* Mobile layout */}
              <div className="divide-y divide-slate-200 lg:hidden">
                {categorySettings.map(setting => (
                  <div key={setting.event} className="p-4 space-y-2">
                    <p className="text-sm font-medium text-white">{setting.eventLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {channelHeaders.map(ch => (
                        <button
                          key={ch.key}
                          onClick={() => toggleChannel(setting.event, ch.key)}
                          disabled={!isAdmin}
                          className={`press-squish focus-ring inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                            setting[ch.key]
                              ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          } ${isAdmin ? 'cursor-pointer hover:border-indigo-300 hover:bg-indigo-100' : 'cursor-default'}`}
                        >
                          {ch.icon}
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="text-left px-4 py-2.5 font-medium">イベント</th>
                      {channelHeaders.map(ch => (
                        <th key={ch.key} className="text-center px-4 py-2.5 font-medium w-24">
                          <div className="flex items-center justify-center gap-1">
                            {ch.icon}
                            {ch.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {categorySettings.map(setting => (
                      <tr key={setting.event} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700">{setting.eventLabel}</td>
                        {channelHeaders.map(ch => (
                          <td key={ch.key} className="text-center px-4 py-2.5">
                            <Switch
                              checked={setting[ch.key]}
                              onCheckedChange={() => toggleChannel(setting.event, ch.key)}
                              disabled={!isAdmin}
                              className={setting[ch.key] ? 'data-[state=checked]:bg-indigo-500' : 'data-[state=unchecked]:bg-slate-300'}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* Escalation Rules */}
      <div>
        <h2 className="mb-3 text-lg font-bold text-slate-900">エスカレーション設定</h2>
        <div className="space-y-3">
          {escalationRules.map(rule => (
            <Card key={rule.event} className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-0">
                <button
                  className="press-squish focus-ring w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpandedEscalation(
                    expandedEscalation === rule.event ? null : rule.event
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{rule.label}</p>
                    <p className="text-xs text-slate-500">{rule.steps.length}ステップ</p>
                  </div>
                  {expandedEscalation === rule.event
                    ? <ChevronUp size={16} className="accordion-chevron text-slate-400" data-state="open" />
                    : <ChevronDown size={16} className="accordion-chevron text-slate-400" />
                  }
                </button>
                {expandedEscalation === rule.event && (
                  <div className="px-4 pb-4 space-y-2">
                    {rule.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700">{step.label}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {step.delayMinutes === 0 ? '即時' : `+${step.delayMinutes}分`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
