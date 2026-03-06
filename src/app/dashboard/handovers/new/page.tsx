'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Sparkles, UploadCloud, Loader2, Pencil } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { patientData, requestData } from '@/lib/mock-data'
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

// Mock AI response
const mockAiGenerate = (rawInput: string, patientName: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`【申し送り】${patientName}様

■ 対応概要
${rawInput.includes('発熱') || rawInput.includes('熱') 
  ? '夜間に発熱の報告を受け、訪問対応を実施しました。' 
  : '夜間に状態変化の報告を受け、訪問対応を実施しました。'}

■ 対応内容
${rawInput}

■ バイタルサイン
${rawInput.includes('38') ? '・体温: 38℃台' : '・体温: 測定値を記入してください'}
・血圧/脈拍: 測定値を記入してください
・SpO2: 測定値を記入してください

■ 患者の状態
対応後、症状は落ち着いており、バイタルも安定傾向です。
引き続き経過観察が必要です。

■ 翌朝への引き継ぎ事項
・主治医への報告をお願いします
・次回訪問時にバイタルの再確認をお願いします
${rawInput.includes('薬') ? '・処方内容の確認をお願いします' : ''}

■ 添付資料
・報告書PDFを添付（メディックス作成分）`)
    }, 1500)
  })
}

export default function NewHandoverPage() {
  useAuth()
  const router = useRouter()

  const [selectedRequestId, setSelectedRequestId] = useState<string>('')
  const [patientName, setPatientName] = useState('')
  const [pharmacyName, setPharmacyName] = useState('')

  // AI-assisted flow
  const [rawInput, setRawInput] = useState('')
  const [generatedDoc, setGeneratedDoc] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)

  const handleRequestChange = (value: string) => {
    setSelectedRequestId(value)
    if (value && value !== 'none') {
      const request = requestData.find((r) => r.id === value)
      if (request) {
        const patient = patientData.find((p) => p.id === request.patientId)
        setPatientName(patient?.name ?? request.patientName)
        setPharmacyName(request.pharmacyName)
      }
    } else {
      setPatientName('')
      setPharmacyName('')
    }
  }

  const handleGenerate = async () => {
    if (!rawInput.trim()) return
    setIsGenerating(true)
    const result = await mockAiGenerate(rawInput, patientName || '（患者名）')
    setGeneratedDoc(result)
    setIsGenerating(false)
    setIsEditing(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push('/dashboard/handovers')
  }

  const handleFileDrop = () => {
    setUploadedFile('report_sample.pdf')
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
            <p className="text-xs text-gray-400">AIが文書作成をサポートします</p>
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
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Raw Input */}
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">1</span>
                対応内容をメモ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-400">
                箇条書きでOK。AIが読みやすい申し送り文書にまとめます。
              </p>
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
                    AIが文書作成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    AIで申し送り文書を作成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Generated Document */}
          {generatedDoc && (
            <Card className="border-indigo-500/30 bg-[#111827]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm text-white">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">2</span>
                    生成された申し送り文書
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
                      {isEditing ? '完了' : '編集'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerate}
                      className="h-7 border-[#2a3553] text-xs text-gray-300 hover:bg-[#1a2035]"
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      再生成
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={generatedDoc}
                    onChange={(e) => setGeneratedDoc(e.target.value)}
                    className="min-h-[300px] border-indigo-500/30 bg-[#1a2035] text-gray-200 font-mono text-sm"
                  />
                ) : (
                  <div className="rounded-lg border border-[#2a3553] bg-[#0a0e1a] p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200 font-sans">
                      {generatedDoc}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Attachment */}
          <Card className="border-[#2a3553] bg-[#111827]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">3</span>
                報告書添付（任意）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={handleFileDrop}
                className={cn(
                  'flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition',
                  uploadedFile
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : 'border-[#2a3553] bg-[#1a2035] hover:border-indigo-500/40 hover:bg-indigo-500/5'
                )}
              >
                <UploadCloud className={cn('h-8 w-8', uploadedFile ? 'text-emerald-400' : 'text-gray-500')} />
                {uploadedFile ? (
                  <>
                    <p className="mt-2 text-sm font-medium text-emerald-300">{uploadedFile}</p>
                    <p className="mt-1 text-xs text-gray-400">クリックして変更</p>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-medium text-gray-300">
                      メディックス等で作成した報告書PDFを添付
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      クリックまたはドラッグ&ドロップ
                    </p>
                  </>
                )}
              </button>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/handovers">
              <Button type="button" variant="ghost" className="text-gray-300 hover:text-white">
                キャンセル
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!generatedDoc && !uploadedFile}
              className="bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              <Save className="mr-1.5 h-4 w-4" />
              保存する
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
