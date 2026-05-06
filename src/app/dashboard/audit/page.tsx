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
  AdminPageHeader,
  AdminStatCard,
  adminCardClass,
  adminInputClass,
  adminPageClass,
  adminPanelClass,
  adminTableClass,
} from '@/components/admin-ui'
import { LoadingState } from '@/components/common/LoadingState'
import {
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

const billingAuditActions = [
  'billing_generate',
  'billing_collection_status_changed',
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
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  denied: 'border-rose-200 bg-rose-50 text-rose-700',
}

function getAuditActionLabel(action: string) {
  return auditActionLabel[action as AuditActionType] ?? action.replaceAll('_', ' ')
}

function getAuditActionClass(action: string) {
  return auditActionClass[action as AuditActionType] ?? 'border-slate-200 bg-slate-50 text-slate-700'
}

function parseTimestamp(value: string) {
  return new Date(value.replace(' ', 'T'))
}

function formatDetails(value: string | Record<string, unknown> | null) {
  if (!value) return '詳細なし'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

function splitBillingAuditDetails(value: string | Record<string, unknown> | null) {
  const formatted = formatDetails(value)
  return formatted.split(' / ').filter(Boolean)
}

function extractReasonTags(value: string | Record<string, unknown> | null) {
  const formatted = formatDetails(value)
  const matches = formatted.match(/#[^\s#/]+/g) ?? []
  return Array.from(new Set(matches))
}

export default function AuditPage() {
  const { role } = useAuth()
  const [actionFilter, setActionFilter] = useState<AuditActionType | 'all'>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [logs, setLogs] = useState<AuditPageEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [billingStatusFocus, setBillingStatusFocus] = useState<'all' | 'on_hold'>('all')

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setLoadError(null)
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
      .catch((error) => {
        if (cancelled) return
        setLogs([])
        setLoadError(error instanceof Error ? error.message : 'audit_logs_fetch_failed')
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
    const query = search.trim().toLowerCase()

    return logs.filter((entry) => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false
      if (userFilter !== 'all' && entry.user !== userFilter) return false
      if (billingStatusFocus === 'on_hold') {
        const detailText = typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)
        const targetText = entry.target ?? ''
        const isBillingAttention = entry.action === 'billing_collection_status_changed' && (`${targetText} ${detailText}`).includes('要確認')
        if (!isBillingAttention) return false
      }

      const timestamp = parseTimestamp(entry.timestamp)

      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`)
        if (timestamp < start) return false
      }

      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`)
        if (timestamp > end) return false
      }

      if (query) {
        const haystack = [entry.user, entry.target, entry.scopeLabel, roleLabel[entry.role] ?? entry.role, typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details)]
        if (!haystack.some((value) => value.toLowerCase().includes(query))) return false
      }

      return true
    })
  }, [actionFilter, billingStatusFocus, userFilter, endDate, startDate, logs, search])

  if (role !== 'system_admin' && role !== 'regional_admin') {
    return (
      <Card className={adminCardClass}>
        <CardHeader>
          <CardTitle className="text-base text-slate-900">監査ログ</CardTitle>
          <CardDescription className="text-slate-600">このページは システム管理者 または リージョン管理者 のみ閲覧できます。</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={adminPageClass}>
      <AdminPageHeader title="監査ログ" description="操作履歴を時系列で確認します。アカウント管理、患者操作、拒否アクセスもここで追えます。" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <AdminStatCard label="表示件数" value={filteredLogs.length} />
        <AdminStatCard label="アカウント管理" value={filteredLogs.filter((entry) => accountAuditActions.includes(entry.action as (typeof accountAuditActions)[number])).length} tone="primary" />
        <AdminStatCard label="回収状況更新" value={filteredLogs.filter((entry) => billingAuditActions.includes(entry.action as (typeof billingAuditActions)[number])).length} tone="warning" />
        <AdminStatCard label="成功" value={filteredLogs.filter((entry) => entry.result === 'success').length} tone="success" />
        <AdminStatCard label="拒否アクセス" value={filteredLogs.filter((entry) => entry.result === 'denied').length} tone="danger" />
      </div>

      <Card className={adminCardClass}>
        <CardContent className="space-y-3 p-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ユーザー名、対象患者、スコープ、操作内容で検索"
            className={adminInputClass}
          />
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn('cursor-pointer border text-xs', actionFilter === 'all' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700')}
              onClick={() => {
                setActionFilter('all')
                setBillingStatusFocus('all')
              }}
            >
              すべて
            </Badge>
            <Badge
              variant="outline"
              className={cn('cursor-pointer border text-xs', actionFilter === 'billing_collection_status_changed' ? 'border-amber-500 bg-amber-500 text-white' : 'border-amber-200 bg-amber-50 text-amber-700')}
              onClick={() => setActionFilter('billing_collection_status_changed')}
            >
              回収状況更新だけ
            </Badge>
            <Badge
              variant="outline"
              className={cn('cursor-pointer border text-xs', billingStatusFocus === 'on_hold' ? 'border-rose-500 bg-rose-500 text-white' : 'border-rose-200 bg-rose-50 text-rose-700')}
              onClick={() => {
                setActionFilter('billing_collection_status_changed')
                setBillingStatusFocus((current) => current === 'on_hold' ? 'all' : 'on_hold')
              }}
            >
              要確認だけ
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <p className="text-xs text-slate-500">アクション種別</p>
              <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as AuditActionType | 'all')}>
                <SelectTrigger className={adminInputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900">
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="login">ログイン</SelectItem>
                  <SelectItem value="request_update">依頼更新</SelectItem>
                  <SelectItem value="handover_confirm">申し送り確認</SelectItem>
                  <SelectItem value="staff_update">スタッフ更新</SelectItem>
                  <SelectItem value="billing_generate">請求生成</SelectItem>
                  <SelectItem value="billing_collection_status_changed">回収状況更新</SelectItem>
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
              <p className="text-xs text-slate-500">ユーザー</p>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className={adminInputClass}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-slate-200 bg-white text-slate-900">
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
              <p className="text-xs text-slate-500">開始日</p>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={adminInputClass} />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-slate-500">終了日</p>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={adminInputClass} />
            </div>
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <Card className="border-rose-200 bg-rose-50">
          <CardContent className="space-y-1 p-4">
            <p className="text-sm font-medium text-rose-800">監査ログを取得できませんでした。</p>
            <p className="text-xs text-rose-700">実ログの代わりにサンプルは表示していません。実患者POC前に API / DB / 権限を確認してください。</p>
            <p className="text-[11px] text-rose-600">error: {loadError}</p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? <LoadingState message="監査ログを読み込み中です。" className="text-xs" /> : <p className="text-xs text-slate-500">表示件数: {filteredLogs.length}件</p>}

      {!isLoading && !loadError && filteredLogs.length === 0 ? (
        <Card className={adminCardClass}>
          <CardContent className="p-4 text-sm text-slate-600">条件に一致する監査ログはありません。</CardContent>
        </Card>
      ) : null}

      <div className="space-y-2 lg:hidden">
        {filteredLogs.map((entry) => {
          const expanded = expandedId === entry.id

          return (
            <Card key={entry.id} className={cn('soft-pop cursor-pointer hover:border-slate-300 hover:shadow-md', adminCardClass)} onClick={() => setExpandedId(expanded ? null : entry.id)}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{entry.user}</p>
                    <p className="text-xs text-slate-500">{roleLabel[entry.role]} / {entry.timestamp}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={cn('border text-[11px]', getAuditActionClass(entry.action))}>
                      {getAuditActionLabel(entry.action)}
                    </Badge>
                    <Badge variant="outline" className={cn('border text-[10px]', resultClass[entry.result])}>{entry.result}</Badge>
                  </div>
                </div>

                <p className="text-xs text-slate-700">対象: {entry.target}</p>
                {entry.action === 'billing_collection_status_changed' ? <p className="text-[11px] text-slate-500">回収状況の更新履歴です。前の状態から今の状態への流れが分かります</p> : null}
                <p className="text-[11px] text-slate-500">スコープ: {entry.scopeLabel}</p>
                {entry.action === 'billing_collection_status_changed' && extractReasonTags(entry.details).length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {extractReasonTags(entry.details).map((tag) => (
                      <Badge key={tag} variant="outline" className="border-rose-200 bg-rose-50 text-[10px] text-rose-700">{tag}</Badge>
                    ))}
                  </div>
                ) : null}

                {expanded ? (
                  <div className={`${adminPanelClass} space-y-2 p-2 text-xs text-slate-700`}>
                    {entry.action === 'billing_collection_status_changed'
                      ? splitBillingAuditDetails(entry.details).map((line) => (
                          <p key={line} className="rounded-md border border-slate-200 bg-white px-2 py-1">{line}</p>
                        ))
                      : <p className="whitespace-pre-wrap">{formatDetails(entry.details)}</p>}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className={`hidden lg:block ${adminTableClass}`}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-slate-50">
                <TableHead className="text-slate-500">日時</TableHead>
                <TableHead className="text-slate-500">ユーザー</TableHead>
                <TableHead className="text-slate-500">操作</TableHead>
                <TableHead className="text-slate-500">結果</TableHead>
                <TableHead className="text-slate-500">対象</TableHead>
                <TableHead className="text-slate-500">詳細</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((entry) => {
                const expanded = expandedId === entry.id

                return (
                  <Fragment key={entry.id}>
                    <TableRow className={cn('cursor-pointer border-slate-200 transition hover:bg-slate-50', entry.action === 'billing_collection_status_changed' ? 'bg-amber-50/40' : '')} onClick={() => setExpandedId(expanded ? null : entry.id)}>
                      <TableCell className="text-slate-600">
                        <div>
                          <p>{entry.timestamp}</p>
                          {entry.action === 'billing_collection_status_changed' ? <p className="text-[11px] text-slate-500">回収状況の更新履歴</p> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-900">
                        <div>
                          <p>{entry.user}</p>
                          <p className="text-[11px] text-slate-500">{roleLabel[entry.role]}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border text-xs', getAuditActionClass(entry.action))}>
                          {getAuditActionLabel(entry.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border text-xs', resultClass[entry.result])}>
                          {entry.result}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <div>
                          <p>{entry.target}</p>
                          <p className="text-[11px] text-slate-500">{entry.scopeLabel}</p>
                          {entry.action === 'billing_collection_status_changed' && extractReasonTags(entry.details).length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {extractReasonTags(entry.details).map((tag) => (
                                <Badge key={tag} variant="outline" className="border-rose-200 bg-rose-50 text-[10px] text-rose-700">{tag}</Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {entry.action === 'billing_collection_status_changed' ? 'クリックで更新内容を表示' : 'クリックで詳細表示'}
                      </TableCell>
                    </TableRow>

                    {expanded && (
                      <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                        <TableCell colSpan={6} className="space-y-2 text-sm text-slate-700">
                          {entry.action === 'billing_collection_status_changed' ? (
                            <div className="space-y-2">
                              {extractReasonTags(entry.details).length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {extractReasonTags(entry.details).map((tag) => (
                                    <Badge key={tag} variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">{tag}</Badge>
                                  ))}
                                </div>
                              ) : null}
                              {splitBillingAuditDetails(entry.details).map((line) => (
                                <p key={line} className="rounded-md border border-slate-200 bg-white px-3 py-2">{line}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{formatDetails(entry.details)}</p>
                          )}
                          <p className="text-[11px] text-slate-500">scope_type: {entry.scopeType}</p>
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
