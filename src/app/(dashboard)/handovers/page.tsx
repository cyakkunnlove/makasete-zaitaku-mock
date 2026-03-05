'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { CheckCircle2, ChevronDown, ChevronUp, Plus } from 'lucide-react'

interface HandoverItem {
  id: string
  pharmacistName: string
  patientName: string
  pharmacyName: string
  timestamp: string
  confirmed: boolean
  confirmedAt: string | null
  situation: string
  background: string
  assessment: string
  recommendation: string
  vitals: {
    temperature: string
    bloodPressure: string
    pulse: string
    spo2: string
  }
}

const initialHandovers: HandoverItem[] = [
  {
    id: 'HO-260301',
    pharmacistName: '佐藤 健一',
    patientName: '田中 優子',
    pharmacyName: '城南みらい薬局',
    timestamp: '2026/03/05 00:21',
    confirmed: false,
    confirmedAt: null,
    situation: '38.6℃の発熱と悪寒が持続。夜間に食事摂取ができず。',
    background: '肺炎既往あり。抗菌薬内服中だが夕方から体調悪化。',
    assessment: '脱水傾向あり。呼吸数やや増加、SpO2は93%まで低下。',
    recommendation: '朝一で主治医へ報告し、採血と点滴可否を確認してください。',
    vitals: {
      temperature: '38.6',
      bloodPressure: '102/64',
      pulse: '108',
      spo2: '93',
    },
  },
  {
    id: 'HO-260302',
    pharmacistName: '高橋 奈央',
    patientName: '小川 正子',
    pharmacyName: '港北さくら薬局',
    timestamp: '2026/03/05 00:04',
    confirmed: true,
    confirmedAt: '2026/03/05 00:36',
    situation: '疼痛コントロール不良でNRS 8/10。体動時に疼痛増強。',
    background: 'がん性疼痛。レスキュー使用回数が本日5回。',
    assessment: '鎮痛薬の効果持続が短く、夜間増悪パターンを確認。',
    recommendation: '定時鎮痛薬の増量検討。主治医へ翌朝相談をお願いします。',
    vitals: {
      temperature: '37.1',
      bloodPressure: '118/72',
      pulse: '96',
      spo2: '97',
    },
  },
  {
    id: 'HO-260303',
    pharmacistName: '山口 美咲',
    patientName: '清水 恒一',
    pharmacyName: '中野しらさぎ薬局',
    timestamp: '2026/03/04 23:48',
    confirmed: false,
    confirmedAt: null,
    situation: 'せん妄症状が増悪し、夜間に興奮状態。',
    background: '認知症あり。日中は落ち着いていたが夕食後から不穏。',
    assessment: '服薬タイミングずれの可能性。転倒リスクが高い状態。',
    recommendation: '家族へ環境調整を依頼し、明朝の訪問前倒しを推奨します。',
    vitals: {
      temperature: '36.8',
      bloodPressure: '130/78',
      pulse: '102',
      spo2: '96',
    },
  },
  {
    id: 'HO-260304',
    pharmacistName: '佐々木 翔',
    patientName: '橋本 和子',
    pharmacyName: '池袋みどり薬局',
    timestamp: '2026/03/04 23:20',
    confirmed: true,
    confirmedAt: '2026/03/04 23:55',
    situation: '嘔吐後のふらつきあり。',
    background: '慢性心不全。利尿薬調整中。',
    assessment: '軽度脱水と起立性低血圧が疑われる。',
    recommendation: '翌朝まで経口補水を継続し、体位変換時に介助を依頼。',
    vitals: {
      temperature: '36.5',
      bloodPressure: '94/58',
      pulse: '90',
      spo2: '95',
    },
  },
]

const sectionStyles = {
  situation: {
    label: 'S: Situation（状況）',
    className: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
  },
  background: {
    label: 'B: Background（背景）',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
  },
  assessment: {
    label: 'A: Assessment（評価）',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  },
  recommendation: {
    label: 'R: Recommendation（提言）',
    className: 'border-purple-500/40 bg-purple-500/10 text-purple-100',
  },
}

export default function HandoversPage() {
  const { role, user } = useAuth()
  const [handovers, setHandovers] = useState<HandoverItem[]>(initialHandovers)
  const [expandedId, setExpandedId] = useState<string | null>(initialHandovers[0]?.id ?? null)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    pharmacistName: '',
    patientName: '',
    pharmacyName: '',
    situation: '',
    background: '',
    assessment: '',
    recommendation: '',
    temperature: '',
    bloodPressure: '',
    pulse: '',
    spo2: '',
  })

  const unconfirmedCount = useMemo(
    () => handovers.filter((handover) => !handover.confirmed).length,
    [handovers]
  )

  const handleConfirm = (id: string) => {
    if (role !== 'pharmacy_admin') return

    const confirmedAt = new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    setHandovers((prev) =>
      prev.map((handover) =>
        handover.id === id
          ? {
              ...handover,
              confirmed: true,
              confirmedAt,
            }
          : handover
      )
    )
  }

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const now = new Date().toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const newItem: HandoverItem = {
      id: `HO-${Date.now()}`,
      pharmacistName: formData.pharmacistName || user?.full_name || '未設定',
      patientName: formData.patientName,
      pharmacyName: formData.pharmacyName,
      timestamp: now,
      confirmed: false,
      confirmedAt: null,
      situation: formData.situation,
      background: formData.background,
      assessment: formData.assessment,
      recommendation: formData.recommendation,
      vitals: {
        temperature: formData.temperature,
        bloodPressure: formData.bloodPressure,
        pulse: formData.pulse,
        spo2: formData.spo2,
      },
    }

    setHandovers((prev) => [newItem, ...prev])
    setExpandedId(newItem.id)
    setNewDialogOpen(false)
    setFormData({
      pharmacistName: '',
      patientName: '',
      pharmacyName: '',
      situation: '',
      background: '',
      assessment: '',
      recommendation: '',
      temperature: '',
      bloodPressure: '',
      pulse: '',
      spo2: '',
    })
  }

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">申し送り</h1>
          <p className="text-xs text-gray-400">SBAR形式で夜間対応内容を共有・確認</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-amber-500/40 bg-amber-500/20 text-amber-300"
          >
            未確認 {unconfirmedCount}件
          </Badge>
          <Button
            onClick={() => setNewDialogOpen(true)}
            className="bg-indigo-500 text-white hover:bg-indigo-500/90"
          >
            <Plus className="h-4 w-4" />
            New Handover
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {handovers.map((handover) => {
          const isExpanded = expandedId === handover.id

          return (
            <Card key={handover.id} className="border-[#2a3553] bg-[#1a2035]">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base text-white">{handover.patientName}</CardTitle>
                    <p className="mt-1 text-xs text-gray-400">
                      担当: {handover.pharmacistName} ・ {handover.pharmacyName}
                    </p>
                    <p className="text-xs text-gray-500">{handover.timestamp}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'border',
                        handover.confirmed
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                      )}
                    >
                      {handover.confirmed ? '確認済み' : '未確認'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : handover.id)}
                      className="text-gray-300 hover:bg-[#11182c] hover:text-white"
                    >
                      詳細
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-3 pt-0">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className={cn('rounded-lg border p-3', sectionStyles.situation.className)}>
                      <p className="text-xs font-semibold">{sectionStyles.situation.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{handover.situation}</p>
                    </div>
                    <div className={cn('rounded-lg border p-3', sectionStyles.background.className)}>
                      <p className="text-xs font-semibold">{sectionStyles.background.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{handover.background}</p>
                    </div>
                    <div className={cn('rounded-lg border p-3', sectionStyles.assessment.className)}>
                      <p className="text-xs font-semibold">{sectionStyles.assessment.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{handover.assessment}</p>
                    </div>
                    <div className={cn('rounded-lg border p-3', sectionStyles.recommendation.className)}>
                      <p className="text-xs font-semibold">{sectionStyles.recommendation.label}</p>
                      <p className="mt-2 text-sm leading-relaxed">{handover.recommendation}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
                    <p className="text-xs font-semibold text-gray-300">バイタル</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-200 sm:grid-cols-4">
                      <p>体温: {handover.vitals.temperature}℃</p>
                      <p>血圧: {handover.vitals.bloodPressure}</p>
                      <p>脈拍: {handover.vitals.pulse}/分</p>
                      <p>SpO2: {handover.vitals.spo2}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">
                      {handover.confirmedAt ? `確認日時: ${handover.confirmedAt}` : '未確認の申し送りです'}
                    </p>

                    {role === 'pharmacy_admin' && !handover.confirmed && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(handover.id)}
                        className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        確認する
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="border-[#2a3553] bg-[#11182c] text-gray-100 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">新規申し送り</DialogTitle>
            <DialogDescription className="text-gray-400">
              SBAR形式で入力し、バイタルもあわせて登録します。
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pharmacistName" className="text-gray-300">薬剤師名</Label>
                <Input
                  id="pharmacistName"
                  value={formData.pharmacistName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, pharmacistName: event.target.value }))
                  }
                  placeholder="例: 佐藤 健一"
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientName" className="text-gray-300">患者名</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, patientName: event.target.value }))
                  }
                  placeholder="例: 田中 優子"
                  required
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pharmacyName" className="text-gray-300">薬局名</Label>
              <Input
                id="pharmacyName"
                value={formData.pharmacyName}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, pharmacyName: event.target.value }))
                }
                placeholder="例: 城南みらい薬局"
                required
                className="border-[#2a3553] bg-[#1a2035]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="situation" className="text-sky-300">S: Situation（状況）</Label>
              <Textarea
                id="situation"
                value={formData.situation}
                onChange={(event) => setFormData((prev) => ({ ...prev, situation: event.target.value }))}
                required
                className="min-h-[80px] border-sky-500/40 bg-sky-500/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background" className="text-emerald-300">B: Background（背景）</Label>
              <Textarea
                id="background"
                value={formData.background}
                onChange={(event) => setFormData((prev) => ({ ...prev, background: event.target.value }))}
                required
                className="min-h-[80px] border-emerald-500/40 bg-emerald-500/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assessment" className="text-amber-300">A: Assessment（評価）</Label>
              <Textarea
                id="assessment"
                value={formData.assessment}
                onChange={(event) => setFormData((prev) => ({ ...prev, assessment: event.target.value }))}
                required
                className="min-h-[80px] border-amber-500/40 bg-amber-500/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendation" className="text-purple-300">R: Recommendation（提言）</Label>
              <Textarea
                id="recommendation"
                value={formData.recommendation}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, recommendation: event.target.value }))
                }
                required
                className="min-h-[80px] border-purple-500/40 bg-purple-500/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-gray-300">体温</Label>
                <Input
                  id="temperature"
                  value={formData.temperature}
                  onChange={(event) => setFormData((prev) => ({ ...prev, temperature: event.target.value }))}
                  placeholder="36.8"
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bloodPressure" className="text-gray-300">血圧</Label>
                <Input
                  id="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, bloodPressure: event.target.value }))
                  }
                  placeholder="120/70"
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pulse" className="text-gray-300">脈拍</Label>
                <Input
                  id="pulse"
                  value={formData.pulse}
                  onChange={(event) => setFormData((prev) => ({ ...prev, pulse: event.target.value }))}
                  placeholder="72"
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spo2" className="text-gray-300">SpO2</Label>
                <Input
                  id="spo2"
                  value={formData.spo2}
                  onChange={(event) => setFormData((prev) => ({ ...prev, spo2: event.target.value }))}
                  placeholder="98"
                  className="border-[#2a3553] bg-[#1a2035]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setNewDialogOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90">
                登録する
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
