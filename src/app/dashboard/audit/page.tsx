'use client'

import { Fragment, useMemo, useState } from 'react'
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
  auditUsers,
  type AuditActionType,
} from '@/lib/mock-data'

function parseTimestamp(value: string) {
  return new Date(value.replace(' ', 'T'))
}

export default function AuditPage() {
  const { role } = useAuth()
  const [actionFilter, setActionFilter] = useState<AuditActionType | 'all'>('all')
  const [userFilter, setUserFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('2026-03-04')
  const [endDate, setEndDate] = useState('2026-03-05')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredLogs = useMemo(() => {
    return auditLogData.filter((entry) => {
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
  }, [actionFilter, userFilter, endDate, startDate])

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
        <p className="text-xs text-gray-400">操作履歴を時系列で確認し、詳細を監査</p>
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
                  {auditUsers.map((user) => (
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

      <p className="text-xs text-gray-400">表示件数: {filteredLogs.length}件</p>

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
                    <p className="text-xs text-gray-400">{entry.timestamp}</p>
                  </div>
                  <Badge variant="outline" className={cn('border text-[11px]', auditActionClass[entry.action])}>
                    {auditActionLabel[entry.action]}
                  </Badge>
                </div>

                <p className="text-xs text-gray-300">対象: {entry.target}</p>

                {expanded && (
                  <div className="rounded-md border border-[#2a3553] bg-[#11182c] p-2 text-xs text-gray-200">
                    {entry.details}
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
                      <TableCell className="text-white">{entry.user}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border text-xs', auditActionClass[entry.action])}>
                          {auditActionLabel[entry.action]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{entry.target}</TableCell>
                      <TableCell className="text-gray-400">クリックで詳細表示</TableCell>
                    </TableRow>

                    {expanded && (
                      <TableRow className="border-[#2a3553] bg-[#11182c] hover:bg-[#11182c]">
                        <TableCell colSpan={5} className="text-sm text-gray-200">
                          {entry.details}
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
