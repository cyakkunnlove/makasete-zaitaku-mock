'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Sparkles, Loader2, Pencil, Camera, CheckCircle2, XCircle, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { patientData, requestData } from '@/lib/mock-data'
import type { RegisteredPatientRecord } from '@/lib/patient-master'
import { mergePatientSources } from '@/lib/patient-read-model'
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
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const mockAiGenerate = (rawInput: string, patientName: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`【申し送り】${patientName}様

■ 対応概要
${rawInput.includes('発熱') || rawInput.includes('熱')
  ? '夜間に発熱の報告を受け、対応を実施しました。'
  : '夜間に状態変化の報告を受け、対応を実施しました。'}

■ 対応内容
${rawInput}

■ 翌朝への引き継ぎ事項
・朝の時点で状態再確認をお願いします
・必要時は主治医連携をお願いします
${rawInput.includes('薬') ? '・処方内容の確認をお願いします' : ''}`)
    }, 1200)
  })
}

export default function NewHandoverPage() {
  useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedRequestId, setSelectedRequestId] = useState<string>('')
  const [databasePatients, setDatabasePatients] = useState<RegisteredPatientRecord[]>([])
  const [patientName, setPatientName] = useState('')
  const [pharmacyName, setPharmacyName] = useState('')
  const [assignedPharmacist, setAssignedPharmacist] = useState('')
  const [isLocked, setIsLocked] = useState(false)

  const [rawInput, setRawInput] = useState('')
  const [draftDoc, setDraftDoc] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<string[]>([])
  const [adoptedAi, setAdoptedAi] = useState(false)

  const requestedRequestId = searchParams.get('requestId') ?? ''

  const selectedRequest = useMemo(
    () => (selectedRequestId && selectedRequestId !== 'none' ? requestData.find((r) => r.id === selectedRequestId) : null),
    [selectedRequestId]
  )

  useEffect(() => {
    const pharmacyId = selectedRequest?.pharmacyId
    if (!pharmacyId) return
    let cancelled = false
    async function fetchPatients() {
      try {
        const response = await fetch(`/api/patients/by-pharmacy/${pharmacyId}`, { cache: 'no-store' })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.patients)) {
          setDatabasePatients(result.patients)
        }
      } catch {
        if (!cancelled) setDatabasePatients([])
      }
    }
    fetchPatients()
    return () => {
      cancelled = true
    }
  }, [selectedRequest?.pharmacyId])

  const patientSource = useMemo(
    () => (databasePatients.length > 0 ? mergePatientSources({ databasePatients, includeMockPatients: false }) : patientData),
    [databasePatients],
  )

  useEffect(() => {
    if (!requestedRequestId || selectedRequestId) return
    const request = requestData.find((r) => r.id === requestedRequestId)
    if (!request) return

    setSelectedRequestId(requestedRequestId)
    const patient = request.patientId ? patientSource.find((p) => p.id === request.patientId) : null
    setPatientName(patient?.name ?? request.patientName ?? '')
    setPharmacyName(patient?.pharmacyName ?? request.pharmacyName ?? '')
    setAssignedPharmacist(request.assignee && request.assignee !== '未割当' ? request.assignee : '夜間担当薬剤師')
    setIsLocked(Boolean(patient?.name || request.patientName || request.pharmacyName || request.assignee))
  }, [requestedRequestId, selectedRequestId])

  const handleRequestChange = (value: string) => {
    setSelectedRequestId(value)
    setAdoptedAi(false)
    if (value && value !== 'none') {
      const request = requestData.find((r) => r.id === value)
      if (request) {
        const patient = request.patientId ? patientSource.find((p) => p.id === request.patientId) : null
        setPatientName(patient?.name ?? request.patientName ?? '')
        setPharmacyName(patient?.pharmacyName ?? request.pharmacyName ?? '')
        setAssignedPharmacist(request.assignee && request.assignee !== '未割当' ? request.assignee : '夜間担当薬剤師')
        setIsLocked(Boolean(patient?.name || request.patientName || request.pharmacyName || request.assignee))
      }
    } else {
      setPatientName('')
      setPharmacyName('')
      setAssignedPharmacist('')
      setIsLocked(false)
    }
  }

  const handleGenerate = async () => {
    if (!rawInput.trim()) return
    setIsGenerating(true)
    const result = await mockAiGenerate(rawInput, patientName || '（患者名）')
    setDraftDoc(result)
    setIsGenerating(false)
    setIsEditing(false)
    setAdoptedAi(false)
  }

  const handleAdoptAi = () => {
    if (!draftDoc.trim()) return
    setAdoptedAi(true)
  }

  const handleRejectAi = () => {
    setAdoptedAi(false)
  }

  const handleAttachPhoto = () => {
    setPhotoFiles((prev) => [...prev, `night-photo-${prev.length + 1}.jpg`])
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/dashboard/handovers')
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-gray-100">
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/handovers">
            <Button variant="ghost" size="icon" className="text-gray-300 hover:bg-[#1a2035] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">新規申し送り作成</h1>
            <p className="text-xs text-gray-400">対応メモをもとにAI整形し、採用するか選べます</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white">依頼の紐付け</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedRequest || !isLocked ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="request" className="text-gray-300">対応した依頼</Label>
                    <Select value={selectedRequestId} onValueChange={handleRequestChange}>
                      <SelectTrigger className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                        <SelectValue placeholder="依頼を選択（任意）" />
                      </SelectTrigger>
                      <SelectContent className="border-[#2a3553] bg-[#1a2035] text-gray-200">
                        <SelectItem value="none">紐付けなし</SelectItem>
                        {requestData.map((req) => (
                          <SelectItem key={req.id} value={req.id}>
                            {req.id} - {req.patientName ?? '患者未特定'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="patientName" className="text-gray-300">患者名</Label>
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
                      <Label htmlFor="pharmacyName" className="text-gray-300">薬局名</Label>
                      <Input
                        id="pharmacyName"
                        value={pharmacyName}
                        onChange={(e) => setPharmacyName(e.target.value)}
                        placeholder="例: 城南みらい薬局"
                        required
                        className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignedPharmacist" className="text-gray-300">対応薬剤師</Label>
                      <Input
                        id="assignedPharmacist"
                        value={assignedPharmacist}
                        onChange={(e) => setAssignedPharmacist(e.target.value)}
                        placeholder="夜間担当薬剤師"
                        required
                        className="border-[#2a3553] bg-[#1a2035] text-gray-200"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                    <Lock className="h-3.5 w-3.5" />
                    この申し送りは依頼に紐づくため、依頼情報は固定表示です。
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                      <p className="text-xs text-gray-500">依頼ID</p>
                      <p className="mt-1 text-sm text-white">{selectedRequest.id}</p>
                    </div>
                    <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                      <p className="text-xs text-gray-500">患者名</p>
                      <p className="mt-1 text-sm text-white">{patientName}</p>
                    </div>
                    <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                      <p className="text-xs text-gray-500">薬局名</p>
                      <p className="mt-1 text-sm text-white">{pharmacyName}</p>
                    </div>
                    <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                      <p className="text-xs text-gray-500">対応薬剤師</p>
                      <p className="mt-1 text-sm text-white">{assignedPharmacist}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">1</span>
                対応内容をメモ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-400">箇条書きでOKです。AIが日中スタッフ向けの申し送り文として整形します。</p>
              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={`例:\n・22:30頃、施設から発熱の連絡\n・訪問して体温38.2℃確認\n・カロナール500mg投与\n・1時間後に37.5℃まで下降\n・水分摂取促し、経過観察指示`}
                className="min-h-[150px] border-[#2a3553] bg-[#1a2035] text-gray-200 placeholder:text-gray-500"
              />
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !rawInput.trim()}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AIが文面を整形中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AIで申し送り文面を整形
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {draftDoc && (
            <Card className="border-indigo-500/30 bg-[#111827]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">2</span>
                    AI整形結果
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="h-7 border-[#2a3553] text-xs text-gray-300 hover:bg-[#1a2035]"
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      {isEditing ? '編集完了' : '編集'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      className="h-7 border-[#2a3553] text-xs text-gray-300 hover:bg-[#1a2035]"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      再整形
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <Textarea
                    value={draftDoc}
                    onChange={(e) => setDraftDoc(e.target.value)}
                    className="min-h-[260px] border-indigo-500/30 bg-[#1a2035] font-mono text-sm text-gray-200"
                  />
                ) : (
                  <div className="rounded-lg border border-[#2a3553] bg-[#0a0e1a] p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-200">{draftDoc}</pre>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={handleAdoptAi} className="bg-emerald-600 text-white hover:bg-emerald-500">
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    この文面を反映する
                  </Button>
                  <Button type="button" variant="outline" onClick={handleRejectAi} className="border-[#2a3553] bg-[#1a2035] text-gray-200 hover:bg-[#212b45]">
                    <XCircle className="mr-1.5 h-4 w-4" />
                    反映しない
                  </Button>
                  {adoptedAi && <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">AI文面を反映中</Badge>}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">3</span>
                写真添付（任意）
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={handleAttachPhoto}
                className={cn(
                  'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition',
                  photoFiles.length > 0
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-[#2a3553] bg-[#1a2035] hover:border-indigo-500/40 hover:bg-indigo-500/5'
                )}
              >
                <Camera className={cn('h-8 w-8', photoFiles.length > 0 ? 'text-emerald-400' : 'text-gray-500')} />
                <p className="mt-2 text-sm font-medium text-gray-300">対応時の写メを添付</p>
                <p className="mt-1 text-xs text-gray-500">クリックしてモック添付</p>
              </button>

              {photoFiles.length > 0 && (
                <div className="space-y-2 rounded-lg border border-[#2a3553] bg-[#1a2035] p-3">
                  <p className="text-xs text-gray-400">添付済み写真</p>
                  {photoFiles.map((file) => (
                    <div key={file} className="text-sm text-gray-200">・{file}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white">申し送り書の仕上がりイメージ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-300">
              <p>対応メモをもとにAIが文面を整え、日中薬局スタッフ向けの申し送り書として共有する想定です。</p>
              <div className="rounded-lg border border-[#2a3553] bg-[#1a2035] p-3 text-xs text-gray-400">
                保存時は「生メモ + 採用した整形文 + 添付写真」をセットで保持する想定です。
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/handovers">
              <Button type="button" variant="ghost" className="text-gray-300 hover:text-white">キャンセル</Button>
            </Link>
            <Button
              type="submit"
              disabled={!rawInput.trim() || (!adoptedAi && !draftDoc.trim())}
              className="bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              <Save className="mr-1.5 h-4 w-4" />
              申し送り書を保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
