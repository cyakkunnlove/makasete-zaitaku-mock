'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock3, MapPin, Route, UserCheck } from 'lucide-react'

const pendingAssignments = [
  {
    id: 'RQ-2411',
    patientName: '中村 恒一',
    pharmacyName: '墨田さくら薬局',
    receivedAt: '00:24',
    priority: '高',
    symptom: '呼吸苦とSpO2低下',
    availablePharmacists: [
      { name: '佐々木 翔', status: '待機中', eta: '12分', distance: '5.2km' },
      { name: '山口 美咲', status: '待機中', eta: '16分', distance: '7.3km' },
    ],
  },
  {
    id: 'RQ-2412',
    patientName: '木村 和子',
    pharmacyName: '品川こもれび薬局',
    receivedAt: '00:31',
    priority: '中',
    symptom: '疼痛コントロール不良',
    availablePharmacists: [
      { name: '高橋 奈央', status: '待機中', eta: '10分', distance: '4.1km' },
      { name: '佐藤 健一', status: '対応後復帰予定', eta: '22分', distance: '9.5km' },
    ],
  },
]

const checklistTemplate = [
  '患者情報と既往歴を確認',
  '処方内容と在庫薬を確認',
  '緊急連絡先に事前連絡',
  '訪問ルート・駐車場所を確認',
  '感染対策キットを準備',
]

function formatCountdown(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const sec = String(seconds % 60).padStart(2, '0')
  return `${minutes}:${sec}`
}

export default function AssignPage() {
  const [countdown, setCountdown] = useState(600)
  const [checklist, setChecklist] = useState(
    checklistTemplate.map((label) => ({ label, checked: false }))
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const toggleChecklist = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, checked: !item.checked } : item
      )
    )
  }

  return (
    <div className="space-y-5 text-slate-900">
      <section>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-slate-900">保留中アサイン</CardTitle>
            <CardDescription className="text-slate-500">未アサイン依頼に担当夜間薬剤師を割り当て</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {assignment.id} / {assignment.patientName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {assignment.pharmacyName} ・ 受付 {assignment.receivedAt}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'border',
                      assignment.priority === '高'
                        ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                        : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                    )}
                  >
                    緊急度 {assignment.priority}
                  </Badge>
                </div>

                <p className="mt-2 text-xs text-gray-300">主訴: {assignment.symptom}</p>

                <div className="mt-3 space-y-2">
                  {assignment.availablePharmacists.map((candidate) => (
                    <div
                      key={`${assignment.id}-${candidate.name}`}
                      className="flex flex-col gap-2 rounded-lg border border-[#2a3553] bg-[#1a2035] p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm text-white">{candidate.name}</p>
                        <p className="text-xs text-gray-400">
                          {candidate.status} ・ 到着見込 {candidate.eta} ・ {candidate.distance}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-indigo-500 text-white hover:bg-indigo-500/90"
                      >
                        <UserCheck className="h-4 w-4" />
                        アサイン
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <Card className="border-[#2a3553] bg-[#1a2035]">
          <CardHeader>
            <CardTitle className="text-base text-white">夜間薬剤師 受諾/辞退ビュー</CardTitle>
            <CardDescription className="text-gray-400">
              アサイン通知後10分以内に回答してください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border-[#2a3553] bg-[#11182c] md:col-span-2">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400">対象依頼</p>
                      <p className="text-sm font-semibold text-white">RQ-2413 / 藤田 京子様</p>
                      <p className="text-xs text-gray-400">台東みなも薬局 ・ 急な呼吸苦</p>
                    </div>
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-2 text-center">
                      <p className="text-xs text-amber-200">回答期限</p>
                      <p className="text-lg font-bold text-amber-300">{formatCountdown(countdown)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button className="h-14 text-base font-bold bg-emerald-600 text-white hover:bg-emerald-600/90">
                      受諾する
                    </Button>
                    <Button className="h-14 text-base font-bold bg-rose-600 text-white hover:bg-rose-600/90">
                      辞退する
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#2a3553] bg-[#11182c]">
                <CardContent className="space-y-3 p-4">
                  <p className="text-sm font-semibold text-white">移動距離</p>
                  <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                    <p className="flex items-center gap-1 text-sm text-indigo-300">
                      <Route className="h-4 w-4" />
                      推定 6.4 km
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-300">
                      <Clock3 className="h-3.5 w-3.5" />
                      到着見込み 18分
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="h-3.5 w-3.5" />
                      台東区浅草 2-14-6
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-[#2a3553] bg-[#11182c]">
              <CardHeader>
                <CardTitle className="text-sm text-white">出発前チェックリスト</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.map((item, index) => (
                  <label
                    key={item.label}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-[#2a3553] bg-[#1a2035] p-3"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecklist(index)}
                      className="h-4 w-4 rounded border-[#2a3553] bg-[#0a0e1a] accent-indigo-500"
                    />
                    <span className={cn('text-sm', item.checked ? 'text-gray-100' : 'text-gray-300')}>
                      {item.label}
                    </span>
                    {item.checked && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />}
                  </label>
                ))}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
