'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bell, RefreshCw, Filter, MessageCircle,
  Mail, Phone, AlertCircle, CheckCircle2,
  Clock, XCircle
} from 'lucide-react'
import {
  notificationLogData,
  notifChannelLabel, notifChannelClass,
  notifStatusLabel, notifStatusClass,
  type NotifChannel, type NotifStatus, type NotificationLogItem,
} from '@/lib/mock-data'

const channelIcons: Record<NotifChannel, React.ReactNode> = {
  line: <MessageCircle size={14} />,
  email: <Mail size={14} />,
  push: <Bell size={14} />,
  phone: <Phone size={14} />,
}

const statusIcons: Record<NotifStatus, React.ReactNode> = {
  sent: <Clock size={14} />,
  delivered: <CheckCircle2 size={14} />,
  failed: <XCircle size={14} />,
  pending: <AlertCircle size={14} />,
}

export default function NotificationsPage() {
  const { role } = useAuth()
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [logs, setLogs] = useState<NotificationLogItem[]>(notificationLogData)
  const [toast, setToast] = useState<string | null>(null)

  const filtered = logs.filter((log) => {
    if (channelFilter !== 'all' && log.channel !== channelFilter) return false
    if (statusFilter !== 'all' && log.status !== statusFilter) return false
    return true
  })

  const handleResend = (id: string) => {
    setLogs(prev => prev.map(l =>
      l.id === id ? { ...l, status: 'pending' as NotifStatus, errorMessage: null } : l
    ))
    setToast('再送をキューに追加しました')
    setTimeout(() => {
      setLogs(prev => prev.map(l =>
        l.id === id ? { ...l, status: 'delivered' as NotifStatus } : l
      ))
      setToast(null)
    }, 2000)
  }

  const failedCount = logs.filter(l => l.status === 'failed').length
  const pendingCount = logs.filter(l => l.status === 'pending').length

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
          <h1 className="text-xl font-bold text-white">通知ログ</h1>
          <p className="text-sm text-gray-400 mt-1">送信済み通知の履歴と状態を確認</p>
        </div>
        <div className="flex items-center gap-2">
          {failedCount > 0 && (
            <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-1 rounded">
              {failedCount}件失敗
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-1 rounded">
              {pendingCount}件待ち
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="border-[#2a3553] bg-[#111827]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-400" />
            <span className="text-sm font-medium text-gray-300">フィルタ</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">チャネル</label>
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#2a3553] rounded-lg px-3 py-2 text-sm text-gray-200"
              >
                <option value="all">すべて</option>
                <option value="line">LINE</option>
                <option value="email">メール</option>
                <option value="push">プッシュ</option>
                <option value="phone">電話</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">ステータス</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#0a0e1a] border border-[#2a3553] rounded-lg px-3 py-2 text-sm text-gray-200"
              >
                <option value="all">すべて</option>
                <option value="delivered">配信済</option>
                <option value="sent">送信済</option>
                <option value="failed">失敗</option>
                <option value="pending">送信待ち</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {filtered.map((log) => (
          <Card key={log.id} className="border-[#2a3553] bg-[#1a2035]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{log.eventLabel}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{log.timestamp}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${notifStatusClass[log.status]}`}>
                  {statusIcons[log.status]}
                  {notifStatusLabel[log.status]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${notifChannelClass[log.channel]}`}>
                  {channelIcons[log.channel]}
                  {notifChannelLabel[log.channel]}
                </span>
                <span className="text-xs text-gray-400">{log.recipientName}</span>
              </div>
              {log.errorMessage && (
                <p className="text-xs text-rose-400 bg-rose-500/10 rounded px-2 py-1">{log.errorMessage}</p>
              )}
              {log.status === 'failed' && role === 'regional_admin' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResend(log.id)}
                  className="w-full border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20"
                >
                  <RefreshCw size={14} className="mr-1" />
                  再送
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Card className="border-[#2a3553] bg-[#111827]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a3553] text-gray-400">
                  <th className="text-left px-4 py-3 font-medium">日時</th>
                  <th className="text-left px-4 py-3 font-medium">イベント</th>
                  <th className="text-left px-4 py-3 font-medium">チャネル</th>
                  <th className="text-left px-4 py-3 font-medium">宛先</th>
                  <th className="text-left px-4 py-3 font-medium">ステータス</th>
                  <th className="text-left px-4 py-3 font-medium">エラー</th>
                  {role === 'regional_admin' && <th className="text-left px-4 py-3 font-medium">操作</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-[#2a3553]/50 hover:bg-[#1a2035]/50">
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-4 py-3 text-white">{log.eventLabel}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${notifChannelClass[log.channel]}`}>
                        {channelIcons[log.channel]}
                        {notifChannelLabel[log.channel]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-200">{log.recipientName}</p>
                        <p className="text-xs text-gray-500">{log.recipientContact}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${notifStatusClass[log.status]}`}>
                        {statusIcons[log.status]}
                        {notifStatusLabel[log.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-rose-400 max-w-[200px] truncate">
                      {log.errorMessage ?? '-'}
                    </td>
                    {role === 'regional_admin' && (
                      <td className="px-4 py-3">
                        {log.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleResend(log.id)}
                            className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 h-7 px-2"
                          >
                            <RefreshCw size={14} className="mr-1" />
                            再送
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>該当する通知ログがありません</p>
        </div>
      )}
    </div>
  )
}
