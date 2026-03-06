'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { patientData, pharmacyData, requestData, sbarStyles } from '@/lib/mock-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export default function NewHandoverPage() {
  useAuth()
  const router = useRouter()

  const [selectedRequestId, setSelectedRequestId] = useState<string>('')
  const [patientName, setPatientName] = useState('')
  const [pharmacyName, setPharmacyName] = useState('')
  const [situation, setSituation] = useState('')
  const [background, setBackground] = useState('')
  const [assessment, setAssessment] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [temperature, setTemperature] = useState('')
  const [bloodPressure, setBloodPressure] = useState('')
  const [pulse, setPulse] = useState('')
  const [spo2, setSpo2] = useState('')
  const [medicationAdministered, setMedicationAdministered] = useState('')
  const [patientCondition, setPatientCondition] = useState('')

  const handleRequestChange = (value: string) => {
    setSelectedRequestId(value)
    if (value && value !== 'none') {
      const request = requestData.find((r) => r.id === value)
      if (request) {
        const patient = patientData.find((p) => p.id === request.patientId)
        const pharmacy = pharmacyData.find((ph) => ph.id === request.pharmacyId)
        setPatientName(patient?.name ?? request.patientName)
        setPharmacyName(pharmacy?.name ?? request.pharmacyName)
      }
    } else {
      setPatientName('')
      setPharmacyName('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/dashboard/handovers')
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/handovers">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:bg-[#1a2035] hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">新規申し送り作成</h1>
            <p className="text-xs text-gray-400">SBAR形式で夜間対応内容を記録します</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request selection */}
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white">依頼の紐付け</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request" className="text-gray-300">
                  対応した依頼
                </Label>
                <Select value={selectedRequestId} onValueChange={handleRequestChange}>
                  <SelectTrigger className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                    <SelectValue placeholder="依頼を選択（任意）" />
                  </SelectTrigger>
                  <SelectContent className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                    <SelectItem value="none">紐付けなし</SelectItem>
                    {requestData.map((req) => (
                      <SelectItem key={req.id} value={req.id}>
                        {req.id} - {req.patientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="patientName" className="text-gray-300">
                    患者名
                  </Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="例: 田中 優子"
                    required
                    className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName" className="text-gray-300">
                    薬局名
                  </Label>
                  <Input
                    id="pharmacyName"
                    value={pharmacyName}
                    onChange={(e) => setPharmacyName(e.target.value)}
                    placeholder="例: 城南みらい薬局"
                    required
                    className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SBAR sections */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white">SBAR</h2>
            <div className="space-y-4">
              <Card className={cn('border', sbarStyles.situation.className)}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="situation" className="text-sm font-semibold text-sky-300">
                      {sbarStyles.situation.label}
                    </Label>
                    <Textarea
                      id="situation"
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      placeholder="患者の現在の状態を簡潔に記述してください"
                      required
                      className="min-h-[100px] border-sky-500/40 bg-sky-500/10 text-sky-100 placeholder:text-sky-300/40"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className={cn('border', sbarStyles.background.className)}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="background" className="text-sm font-semibold text-emerald-300">
                      {sbarStyles.background.label}
                    </Label>
                    <Textarea
                      id="background"
                      value={background}
                      onChange={(e) => setBackground(e.target.value)}
                      placeholder="既往歴や経緯など背景情報を記述してください"
                      required
                      className="min-h-[100px] border-emerald-500/40 bg-emerald-500/10 text-emerald-100 placeholder:text-emerald-300/40"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className={cn('border', sbarStyles.assessment.className)}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="assessment" className="text-sm font-semibold text-amber-300">
                      {sbarStyles.assessment.label}
                    </Label>
                    <Textarea
                      id="assessment"
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      placeholder="評価・判断した内容を記述してください"
                      required
                      className="min-h-[100px] border-amber-500/40 bg-amber-500/10 text-amber-100 placeholder:text-amber-300/40"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className={cn('border', sbarStyles.recommendation.className)}>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="recommendation" className="text-sm font-semibold text-purple-300">
                      {sbarStyles.recommendation.label}
                    </Label>
                    <Textarea
                      id="recommendation"
                      value={recommendation}
                      onChange={(e) => setRecommendation(e.target.value)}
                      placeholder="翌朝以降に対応すべき事項を記述してください"
                      required
                      className="min-h-[100px] border-purple-500/40 bg-purple-500/10 text-purple-100 placeholder:text-purple-300/40"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Vitals */}
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white">バイタルサイン</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature" className="text-gray-300">
                    体温 (℃)
                  </Label>
                  <Input
                    id="temperature"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="36.8"
                    className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodPressure" className="text-gray-300">
                    血圧
                  </Label>
                  <Input
                    id="bloodPressure"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="120/70"
                    className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pulse" className="text-gray-300">
                    脈拍 (/分)
                  </Label>
                  <Input
                    id="pulse"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    placeholder="72"
                    className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spo2" className="text-gray-300">
                    SpO2 (%)
                  </Label>
                  <Input
                    id="spo2"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="98"
                    className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional fields */}
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white">追加情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medicationAdministered" className="text-gray-300">
                  投与薬剤
                </Label>
                <Input
                  id="medicationAdministered"
                  value={medicationAdministered}
                  onChange={(e) => setMedicationAdministered(e.target.value)}
                  placeholder="例: アセトアミノフェン 500mg 経口投与"
                  className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientCondition" className="text-gray-300">
                  患者の状態
                </Label>
                <Textarea
                  id="patientCondition"
                  value={patientCondition}
                  onChange={(e) => setPatientCondition(e.target.value)}
                  placeholder="対応後の患者の状態を記述してください"
                  className="min-h-[80px] border-[#2a3553] bg-[#1a2035] text-gray-200"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/handovers">
              <Button type="button" variant="ghost" className="text-gray-300 hover:text-white">
                キャンセル
              </Button>
            </Link>
            <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-500/90">
              <Save className="mr-1.5 h-4 w-4" />
              保存する
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
