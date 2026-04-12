'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MessageCircle, Copy, Send, CheckCircle2,
  XCircle, Shield, ExternalLink
} from 'lucide-react'
import { getUnifiedRoleLabel, lineUserStatuses } from '@/lib/mock-data'

export default function LineSettingsPage() {
  const { role } = useAuth()
  const isAdmin = role === 'regional_admin'
  const [toast, setToast] = useState<string | null>(null)
  const [channelId, setChannelId] = useState('1234567890')
  const [channelSecret, setChannelSecret] = useState('••••••••••••••••')
  const [accessToken, setAccessToken] = useState('••••••••••••••••••••••••••••••')
  const [testSending, setTestSending] = useState(false)

  const webhookUrl = 'https://makasete-zaitaku.vercel.app/api/webhooks/line'
  const linkedCount = lineUserStatuses.filter(u => u.linked).length
  const totalCount = lineUserStatuses.length

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setToast('Webhook URLをコピーしました')
    setTimeout(() => setToast(null), 2000)
  }

  const handleTestSend = () => {
    setTestSending(true)
    setToast('テストメッセージを送信中...')
    setTimeout(() => {
      setTestSending(false)
      setToast('テストメッセージを送信しました')
      setTimeout(() => setToast(null), 2000)
    }, 1500)
  }

  const handleSave = () => {
    setToast('LINE設定を保存しました')
    setTimeout(() => setToast(null), 3000)
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6 text-gray-100">
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-300">
          <Shield size={16} />
          この画面は Regional Admin のみ確認できます
        </div>
      </div>
    )
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
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageCircle size={24} className="text-green-400" />
            LINE連携設定
          </h1>
          <p className="text-sm text-gray-400 mt-1">LINE Messaging APIの接続設定</p>
        </div>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-amber-300">
          <Shield size={16} />
          LINE設定の編集にはAdmin権限が必要です
        </div>
      )}

      {/* Connection Status */}
      <Card className="border-[#2a3553] bg-[#111827]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MessageCircle size={20} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">LINE Messaging API</p>
                <p className="text-xs text-gray-500">接続中</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              接続済み
            </span>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card className="border-[#2a3553] bg-[#111827]">
        <CardContent className="p-4 space-y-4">
          <h3 className="text-sm font-semibold text-indigo-400">API設定</h3>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Channel ID</label>
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              disabled={!isAdmin}
              className="w-full bg-[#0a0e1a] border border-[#2a3553] rounded-lg px-3 py-2 text-sm text-gray-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Channel Secret</label>
            <input
              type="password"
              value={channelSecret}
              onChange={(e) => setChannelSecret(e.target.value)}
              disabled={!isAdmin}
              className="w-full bg-[#0a0e1a] border border-[#2a3553] rounded-lg px-3 py-2 text-sm text-gray-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Channel Access Token</label>
            <input
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={!isAdmin}
              className="w-full bg-[#0a0e1a] border border-[#2a3553] rounded-lg px-3 py-2 text-sm text-gray-200 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Webhook URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 bg-[#0a0e1a] border border-[#2a3553] rounded-lg px-3 py-2 text-sm text-gray-400"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyWebhook}
                className="border-[#2a3553] text-gray-300 hover:bg-[#1a2035]"
              >
                <Copy size={14} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {isAdmin && (
              <>
                <Button
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  保存
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestSend}
                  disabled={testSending}
                  className="border-green-500/40 text-green-400 hover:bg-green-500/20"
                >
                  <Send size={14} className="mr-1" />
                  {testSending ? '送信中...' : 'テスト送信'}
                </Button>
              </>
            )}
            <a
              href="https://developers.line.biz/console/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300"
            >
              LINE Developers Console
              <ExternalLink size={12} />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* User Link Status */}
      <Card className="border-[#2a3553] bg-[#111827]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-indigo-400">LINE連携状態</h3>
            <span className="text-xs text-gray-500">{linkedCount}/{totalCount}名 連携済み</span>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {lineUserStatuses.map(user => (
              <div key={user.staffId} className="flex items-center gap-3 bg-[#0a0e1a] rounded-lg px-3 py-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  user.linked ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/20 text-gray-500'
                }`}>
                  {user.staffName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">{user.staffName}</p>
                  <p className="text-xs text-gray-500">{getUnifiedRoleLabel(user.role)}</p>
                </div>
                {user.linked ? (
                  <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-gray-500 shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a3553] text-gray-400">
                  <th className="text-left px-3 py-2 font-medium">スタッフ</th>
                  <th className="text-left px-3 py-2 font-medium">ロール</th>
                  <th className="text-left px-3 py-2 font-medium">LINE User ID</th>
                  <th className="text-left px-3 py-2 font-medium">連携日時</th>
                  <th className="text-center px-3 py-2 font-medium">状態</th>
                </tr>
              </thead>
              <tbody>
                {lineUserStatuses.map(user => (
                  <tr key={user.staffId} className="border-b border-[#2a3553]/50 hover:bg-[#1a2035]/50">
                    <td className="px-3 py-2.5 text-gray-200">{user.staffName}</td>
                    <td className="px-3 py-2.5 text-gray-400">{getUnifiedRoleLabel(user.role)}</td>
                    <td className="px-3 py-2.5 text-gray-500 font-mono text-xs">
                      {user.lineUserId ?? '-'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">
                      {user.linkedAt ?? '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {user.linked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
                          <CheckCircle2 size={12} />
                          連携済
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border border-gray-500/40 bg-gray-500/20 text-gray-400">
                          <XCircle size={12} />
                          未連携
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
