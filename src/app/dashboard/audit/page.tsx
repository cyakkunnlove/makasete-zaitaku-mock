'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  auditLogData,
  auditActionLabel,
  auditActionClass,
  type AuditActionType,
} from '@/lib/mock-data'

const accountAuditActions = [
  'account_invitation_created',
  'account_invitation_resent',
  'account_invitation_revoked',
  'account_user_updated',
  'account_user_status_changed',
] as const

type AuditPageEntry = {
  id: string
  timestamp: string
  user: string
  role: string
  scopeType: string
  scopeLabel: string
  action: AuditActionType
  target: string
  details: string | Record<string, unknown> | null
  result: 'success' | 'warning' | 'denied'
}

const roleLabel: Record<string, string> = {
  system_admin: 'システム管理者',
  regional_admin: 'リージョン管理者',
  pharmacy_admin: '薬局管理者',
  pharmacy_staff: '薬局スタッフ',
  night_pharmacist: '夜間薬剤師',
}

const resultClass: Record<'success' | 'warning' | 'denied', string> = {
  success: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  warning: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  denied: 'border-rose-500/40 bg-rose-500/20 text-rose-300',
}

function parseTimestamp(value: string) {
  return new Date(value.replace(' ', 'T'))
}

function formatDetails(value: string | Record<string, unknown> | null) {
  if (!value) return '詳細なし'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

export default function AuditPage() {
  const { role } = useAuth()
  const [actionFilter, setActionFilter] = useState<AuditActionType | 'all'>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('2026-03-04')
  const [endDate, setEndDate] = useState('2026-04-12')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<AuditPageEntry[]>(auditLogData)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    fetch('/api/audit-logs', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok || !data.ok) throw new Error(data.error ?? 'audit_logs_fetch_failed')
        if (cancelled) return
        setLogs((data.logs ?? []).map((entry: AuditPageEntry) => ({
          ...entry,
          details: typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details, null, 2),
        })))
      })
      .catch(() => {
        if (cancelled) return
        setLogs(auditLogData)
      })
      .finally(() => {
        if (cancelled) return
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const visibleUsers = useMemo(() => Array.from(new Set(logs.map((entry) => entry.user))), [logs])

  const filteredLogs = useMemo(() => {
    return logs.filter((entry) => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false

      if (userFilter !== 'all' && entry.user !== userFilter) return false

      const timestamp = parseTimestamp(entry.timestamp)

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`)
        if (timestamp < start) return false
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`)
        if (timestamp > end) return false
      }

      return true
    })
  }, [actionFilter, userFilter, endDate, startDate, logs])

  if (role !== 'system_admin') {
    return (
      <Card className="border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardHeader>
          <CardTitle className="text-base text-white">監査ログ</CardTitle>
          <CardDescription className="text-gray-400">このページは管理者のみ閲覧できます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div>
        <h1 className="text-lg font-semibold text-white">監査ログ</h1>
        <p className="text-xs text-gray-400">操作履歴を時系列で確認します。アカウント管理、患者操作、拒否アクセスもここで追えます。</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-white">{filteredLogs.length}</p><p className="text-[10px] text-gray-500">表示件数</p></CardContent></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-indigo-300">{filteredLogs.filter((entry) => accountAuditActions.includes(entry.action as (typeof accountAuditActions)[number])).length}</p><p className="text-[10px] text-gray-500">アカウント管理</p></CardContent></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-300">{filteredLogs.filter((entry) => entry.result === 'success').length}</p><p className="text-[10px] text-gray-500">成功</p></CardContent></Card>
        <Card className="border-[#2a3553] bg-[#1a2035]"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-rose-300">{filteredLogs.filter((entry) => entry.result === 'denied').length}</p><p className="text-[10px] text-gray-500">拒否アクセス</p></CardContent></Card>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="space-y-3 p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">アクション種別</p>
              <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as AuditActionType | 'all')}>
                <SelectTrigger className="border-[#2a3553] bg-[#11182c]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="login">ログイン</SelectItem>
                  <SelectItem value="request_update">依頼更新</SelectItem>
                  <SelectItem value="handover_confirm">申し送り確認</SelectItem>
                  <SelectItem value="staff_update">スタッフ更新</SelectItem>
                  <SelectItem value="billing_generate">請求生成</SelectItem>
                  <SelectItem value="export_csv">CSV出力</SelectItem>
                  <SelectItem value="pharmacy_update">加盟店更新</SelectItem>
                  <SelectItem value="fax_opened">FAX閲覧</SelectItem>
                  <SelectItem value="patient_search">患者検索</SelectItem>
                  <SelectItem value="patient_linked">患者紐付け</SelectItem>
                  <SelectItem value="patient_view">患者閲覧</SelectItem>
                  <SelectItem value="patient_phone_open">患者電話</SelectItem>
                  <SelectItem value="patient_map_open">地図表示</SelectItem>
                  <SelectItem value="access_denied">拒否アクセス</SelectItem>
                  <SelectItem value="account_invitation_created">招待作成</SelectItem>
                  <SelectItem value="account_invitation_resent">招待再送</SelectItem>
                  <SelectItem value="account_invitation_revoked">招待取消</SelectItem>
                  <SelectItem value="account_user_updated">アカウント更新</SelectItem>
                  <SelectItem value="account_user_status_changed">利用状態変更</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">ユーザー</p>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="border-[#2a3553] bg-[#11182c]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#2a3553] bg-[#11182c] text-gray-100">
                  <SelectItem value="all">すべて</SelectItem>
                  {visibleUsers.map((user) => (
                    <SelectItem key={user} value={user}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">開始日</p>
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="border-[#2a3553] bg-[#11182c]"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">終了日</p>
              <Input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="border-[#2a3553] bg-[#11182c]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-gray-400">{isLoading ? '監査ログを読み込み中です。' : `表示件数: ${filteredLogs.length}件`}</p>

      <div className="space-y-2 lg:hidden">
        {filteredLogs.map((entry) => {
          const expanded = expandedId === entry.id

          return (
            <Card
              key={entry.id}
              className="cursor-pointer border-[#2a3553] bg-[#1a2035]"
              onClick={() => setExpandedId(expanded ? null : entry.id)}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{entry.user}</p>
                    <p className="text-xs text-gray-400">{roleLabel[entry.role]} / {entry.timestamp}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={cn('border text-[11px]', auditActionClass[entry.action])}>
                      {auditActionLabel[entry.action]}
                    </Badge>
                    <Badge variant="outline" className={cn('border text-[10px]', resultClass[entry.result])}>{entry.result}</Badge>
                  </div>
                </div>

                <p className="text-xs text-gray-300">対象: {entry.target}</p>
                <p className="text-[11px] text-gray-500">スコープ: {entry.scopeLabel}</p>

                {expanded && (
                  <div className="rounded-md border border-[#2a3553] bg-[#11182c] p-2 text-xs text-gray-200">
                    {formatDetails(entry.details)}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="hidden border-[#2a3553] bg-[#1a2035] lg:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-[#2a3553] hover:bg-[#1a2035]">
                <TableHead className="text-gray-400">日時</TableHead>
                <TableHead className="text-gray-400">ユーザー</TableHead>
                <TableHead className="text-gray-400">操作</TableHead>
                <TableHead className="text-gray-400">結果</TableHead>
                <TableHead className="text-gray-400">対象</TableHead>
                <TableHead className="text-gray-400">詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((entry) => {
                const expanded = expandedId === entry.id

                return (
                  <Fragment key={entry.id}>
                    <TableRow
                      className="cursor-pointer border-[#2a3553] hover:bg-[#11182c]"
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                    >
                      <TableCell className="text-gray-300">{entry.timestamp}</TableCell>
                      <TableCell className="text-white">
                        <div>
                          <p>{entry.user}</p>
                          <p className="text-[11px] text-gray-500">{roleLabel[entry.role]}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border text-xs', auditActionClass[entry.action])}>
                          {auditActionLabel[entry.action]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border text-xs', resultClass[entry.result])}>
                          {entry.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div>
                          <p>{entry.target}</p>
                          <p className="text-[11px] text-gray-500">{entry.scopeLabel}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400">クリックで詳細表示</TableCell>
                    </TableRow>

                    {expanded && (
                      <TableRow className="border-[#2a3553] bg-[#11182c] hover:bg-[#11182c]">
                        <TableCell colSpan={5} className="space-y-1 text-sm text-gray-200">
                          <p className="whitespace-pre-wrap">{formatDetails(entry.details)}</p>
                          <p className="text-[11px] text-gray-500">scope_type: {entry.scopeType}</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
