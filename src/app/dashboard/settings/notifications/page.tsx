'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const isAdmin = role === 'regional_admin'
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

  return (
    <div className="space-y-6 text-gray-100">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600/90 text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">通知設定</h1>
          <p className="text-sm text-gray-400 mt-1">イベント毎の通知チャネルを設定</p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Save size={16} className="mr-2" />
            保存
          </Button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-300">
          <Shield size={16} />
          通知設定の編集にはAdmin権限が必要です
        </div>
      )}

      {/* Event x Channel Matrix */}
      {categories.map(category => {
        const categorySettings = settings.filter(s => s.category === category)
        return (
          <Card key={category} className="border-[#2a3553] bg-[#111827]">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-[#2a3553]">
                <h3 className="text-sm font-semibold text-indigo-400">{category}</h3>
              </div>

              {/* Mobile layout */}
              <div className="lg:hidden divide-y divide-[#2a3553]/50">
                {categorySettings.map(setting => (
                  <div key={setting.event} className="p-4 space-y-2">
                    <p className="text-sm font-medium text-white">{setting.eventLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {channelHeaders.map(ch => (
                        <button
                          key={ch.key}
                          onClick={() => toggleChannel(setting.event, ch.key)}
                          disabled={!isAdmin}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                            setting[ch.key]
                              ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300'
                              : 'border-[#2a3553] bg-[#0a0e1a] text-gray-500'
                          } ${isAdmin ? 'cursor-pointer hover:border-indigo-500/60' : 'cursor-default'}`}
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
                    <tr className="border-b border-[#2a3553] text-gray-400">
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
                      <tr key={setting.event} className="border-b border-[#2a3553]/50 hover:bg-[#1a2035]/50">
                        <td className="px-4 py-2.5 text-gray-200">{setting.eventLabel}</td>
                        {channelHeaders.map(ch => (
                          <td key={ch.key} className="text-center px-4 py-2.5">
                            <button
                              onClick={() => toggleChannel(setting.event, ch.key)}
                              disabled={!isAdmin}
                              className={`w-10 h-6 rounded-full relative transition-colors ${
                                setting[ch.key] ? 'bg-indigo-600' : 'bg-gray-700'
                              } ${isAdmin ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
                            >
                              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                setting[ch.key] ? 'left-5' : 'left-1'
                              }`} />
                            </button>
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
        <h2 className="text-lg font-bold text-white mb-3">エスカレーション設定</h2>
        <div className="space-y-3">
          {escalationRules.map(rule => (
            <Card key={rule.event} className="border-[#2a3553] bg-[#111827]">
              <CardContent className="p-0">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setExpandedEscalation(
                    expandedEscalation === rule.event ? null : rule.event
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-white">{rule.label}</p>
                    <p className="text-xs text-gray-500">{rule.steps.length}ステップ</p>
                  </div>
                  {expandedEscalation === rule.event
                    ? <ChevronUp size={16} className="text-gray-400" />
                    : <ChevronDown size={16} className="text-gray-400" />
                  }
                </button>
                {expandedEscalation === rule.event && (
                  <div className="px-4 pb-4 space-y-2">
                    {rule.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 bg-[#0a0e1a] rounded-lg px-3 py-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-200">{step.label}</p>
                        </div>
                        <span className="text-xs text-gray-500">
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
