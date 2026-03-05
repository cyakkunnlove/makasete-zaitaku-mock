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

type ActionType =
  | 'login'
  | 'request_update'
  | 'handover_confirm'
  | 'staff_update'
  | 'billing_generate'
  | 'export_csv'
  | 'pharmacy_update'

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: ActionType
  target: string
  details: string
}

const auditLogs: AuditEntry[] = [
  {
    id: 'AL-001',
    timestamp: '2026-03-05 00:58:14',
    user: '田中 直樹',
    action: 'billing_generate',
    target: '請求管理',
    details: '2026-03対象の請求書を6件一括生成。',
  },
  {
    id: 'AL-002',
    timestamp: '2026-03-05 00:50:42',
    user: '山田 美咲',
    action: 'handover_confirm',
    target: 'HO-260301',
    details: '申し送りを確認済みに変更。確認コメント: 朝訪問前倒し。',
  },
  {
    id: 'AL-003',
    timestamp: '2026-03-05 00:47:10',
    user: '佐藤 健一',
    action: 'request_update',
    target: 'RQ-2411',
    details: 'ステータスを in_progress に更新。患者宅到着を記録。',
  },
  {
    id: 'AL-004',
    timestamp: '2026-03-05 00:41:03',
    user: '田中 直樹',
    action: 'staff_update',
    target: 'ST-09',
    details: 'スタッフ状態を active に変更。連絡先情報を更新。',
  },
  {
    id: 'AL-005',
    timestamp: '2026-03-05 00:38:55',
    user: '小林 恒一',
    action: 'login',
    target: '管理画面',
    details: 'MFA認証を伴う管理画面ログインに成功。',
  },
  {
    id: 'AL-006',
    timestamp: '2026-03-05 00:31:19',
    user: '中村 玲子',
    action: 'request_update',
    target: 'RQ-2412',
    details: 'FAX受領時刻を登録し、ステータスを fax_received に更新。',
  },
  {
    id: 'AL-007',
    timestamp: '2026-03-05 00:24:11',
    user: '田中 直樹',
    action: 'pharmacy_update',
    target: 'PH-03',
    details: '転送設定を OFF から ON に変更。',
  },
  {
    id: 'AL-008',
    timestamp: '2026-03-05 00:16:29',
    user: '高橋 奈央',
    action: 'request_update',
    target: 'RQ-2407',
    details: 'ステータスを completed に更新。対応完了メモを追記。',
  },
  {
    id: 'AL-009',
    timestamp: '2026-03-05 00:09:04',
    user: '山口 美咲',
    action: 'handover_confirm',
    target: 'HO-260302',
    details: '申し送り確認とバイタル再評価メモを登録。',
  },
  {
    id: 'AL-010',
    timestamp: '2026-03-04 23:59:57',
    user: '田中 直樹',
    action: 'export_csv',
    target: '実績レポート',
    details: '2026-02の実績CSVをエクスポート。',
  },
  {
    id: 'AL-011',
    timestamp: '2026-03-04 23:51:26',
    user: '伊藤 真理',
    action: 'request_update',
    target: 'RQ-2405',
    details: '患者連絡履歴を追加し優先度を normal に維持。',
  },
  {
    id: 'AL-012',
    timestamp: '2026-03-04 23:44:02',
    user: '田中 直樹',
    action: 'pharmacy_update',
    target: 'PH-05',
    details: '加盟店ステータスを pending から active に変更。',
  },
  {
    id: 'AL-013',
    timestamp: '2026-03-04 23:31:18',
    user: '木村 恒一',
    action: 'login',
    target: '管理画面',
    details: '薬局スタッフ権限でログイン。',
  },
  {
    id: 'AL-014',
    timestamp: '2026-03-04 23:19:42',
    user: '山田 美咲',
    action: 'request_update',
    target: 'RQ-2403',
    details: '主訴を修正し、既往歴リンクを添付。',
  },
  {
    id: 'AL-015',
    timestamp: '2026-03-04 23:12:27',
    user: '小林 恒一',
    action: 'staff_update',
    target: 'ST-08',
    details: 'スタッフ状態を inactive に変更。退職予定登録。',
  },
  {
    id: 'AL-016',
    timestamp: '2026-03-04 22:58:33',
    user: '田中 直樹',
    action: 'billing_generate',
    target: '請求管理',
    details: '再発行対応としてINV-2026-03-004を単体再生成。',
  },
  {
    id: 'AL-017',
    timestamp: '2026-03-04 22:46:11',
    user: '佐藤 健一',
    action: 'request_update',
    target: 'RQ-2401',
    details: '出動記録を追加。到着見込み時刻を更新。',
  },
  {
    id: 'AL-018',
    timestamp: '2026-03-04 22:33:40',
    user: '田中 直樹',
    action: 'login',
    target: '管理画面',
    details: 'システム監視対応のためログイン。',
  },
]

const actionLabel: Record<ActionType, string> = {
  login: 'ログイン',
  request_update: '依頼更新',
  handover_confirm: '申し送り確認',
  staff_update: 'スタッフ更新',
  billing_generate: '請求生成',
  export_csv: 'CSV出力',
  pharmacy_update: '加盟店更新',
}

const actionClass: Record<ActionType, string> = {
  login: 'border-gray-500/40 bg-gray-500/20 text-gray-300',
  request_update: 'border-sky-500/40 bg-sky-500/20 text-sky-300',
  handover_confirm: 'border-purple-500/40 bg-purple-500/20 text-purple-300',
  staff_update: 'border-amber-500/40 bg-amber-500/20 text-amber-300',
  billing_generate: 'border-indigo-500/40 bg-indigo-500/20 text-indigo-300',
  export_csv: 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300',
  pharmacy_update: 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300',
}

function parseTimestamp(value: string) {
  return new Date(value.replace(' ', 'T'))
}

export default function AuditPage() {
  const { role } = useAuth()
  const [actionFilter, setActionFilter] = useState<ActionType | 'all'>('all')
  const [startDate, setStartDate] = useState('2026-03-04')
  const [endDate, setEndDate] = useState('2026-03-05')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((entry) => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false

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
  }, [actionFilter, endDate, startDate])

  if (role !== 'admin') {
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">アクション種別</p>
              <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as ActionType | 'all')}>
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
                  <Badge variant="outline" className={cn('border text-[11px]', actionClass[entry.action])}>
                    {actionLabel[entry.action]}
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
                        <Badge variant="outline" className={cn('border text-xs', actionClass[entry.action])}>
                          {actionLabel[entry.action]}
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
