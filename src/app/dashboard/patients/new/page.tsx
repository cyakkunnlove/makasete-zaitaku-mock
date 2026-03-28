'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, RefreshCcw, Save, UserPlus } from 'lucide-react'
import { patientTagOptions, visitWeekdayOptions } from '@/lib/patient-registration-spec'

export default function NewPatientPage() {
  const [visitCount, setVisitCount] = useState('4')
  const [selectedTags, setSelectedTags] = useState<string[]>(['利用中', '家族連絡用', '配薬場所指定'])
  const [selectedDays, setSelectedDays] = useState<string[]>(['月', '木'])
  const [manualSyncAt, setManualSyncAt] = useState('2026-03-28 22:41')

  const isExceeded = Number(visitCount) > 4

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag])
  }

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day])
  }

  const calendarPreview = useMemo(() => {
    const all = Array.from({ length: 30 }, (_, i) => i + 1)
    return all.map((d) => ({ day: d, active: [1,4,8,11,15,18,22,25,29].includes(d) || (selectedDays.includes('月') && [3,10,17,24].includes(d)) || (selectedDays.includes('木') && [6,13,20,27].includes(d)) }))
  }, [selectedDays])

  return (
    <div className="space-y-4 text-gray-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white"><UserPlus className="h-5 w-5 text-indigo-400" />患者登録（モック）</h1>
          <p className="text-xs text-gray-400">Pharmacy Admin / Pharmacy Staff 向け。将来DB化を想定した患者登録のたたき台です。</p>
        </div>
        <Button variant="outline" className="border-[#2a3553] bg-[#11182c] text-gray-200 hover:bg-[#1a2035]" onClick={() => setManualSyncAt('2026-03-28 22:44')}>
          <RefreshCcw className="h-4 w-4" />
          手動更新
        </Button>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-gray-400">
          <div>
            <p>最終同期: {manualSyncAt}</p>
            <p>最終更新者: Pharmacy Staff（モック） / 最終更新時刻: 2026-03-28 22:42</p>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-200">更新ありバッジ / 手動同期を想定</div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">基本情報</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label className="text-gray-300">氏名</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="山田 花子" /></div>
          <div><Label className="text-gray-300">生年月日</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="1948-04-12" /></div>
          <div><Label className="text-gray-300">患者本人電話</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="090-xxxx-xxxx" /></div>
          <div><Label className="text-gray-300">担当薬局</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="城南みらい薬局" /></div>
          <div className="md:col-span-2"><Label className="text-gray-300">住所</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="東京都八王子市..." /></div>
          <div><Label className="text-gray-300">利用開始日</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="2026-03-28" /></div>
          <div><Label className="text-gray-300">ステータス</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="利用中" /></div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">タグ設定</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-400">患者名の横や注意フラグで表示するタグを手動設定できます。</p>
          <div className="flex flex-wrap gap-2">
            {patientTagOptions.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`rounded-full border px-3 py-1.5 text-xs ${active ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200' : 'border-[#2a3553] bg-[#11182c] text-gray-400'}`}>
                  {tag}
                </button>
              )
            })}
          </div>
          <div className="rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
            <p className="text-xs text-gray-500">プレビュー</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedTags.map((tag) => <span key={tag} className="rounded-full border border-indigo-500/40 bg-indigo-500/20 px-3 py-1 text-xs text-indigo-200">{tag}</span>)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">連絡・医療情報</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label className="text-gray-300">緊急連絡先</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="山田 一郎（長男）" /></div>
          <div><Label className="text-gray-300">連絡先電話</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="090-xxxx-xxxx" /></div>
          <div><Label className="text-gray-300">主治医</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="田中医師 / ○○クリニック" /></div>
          <div><Label className="text-gray-300">現在薬</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="オキシコドン / ラシックス ..." /></div>
          <div className="md:col-span-2"><Label className="text-gray-300">既往歴・アレルギー・主疾患</Label><Textarea className="mt-1 min-h-[100px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="既往歴 / アレルギー / 主疾患を入力" /></div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">訪問スケジュール</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-gray-300">訪問曜日</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {visitWeekdayOptions.map((day) => {
                const active = selectedDays.includes(day)
                return (
                  <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-md border px-3 py-1.5 text-xs ${active ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200' : 'border-[#2a3553] bg-[#11182c] text-gray-400'}`}>
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <Label className="text-gray-300">今月の訪問回数</Label>
            <Input value={visitCount} onChange={(e) => setVisitCount(e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" />
          </div>

          {isExceeded && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              月4回を超過しています。保存は可能ですが、超過警告として扱います。
            </div>
          )}

          <div>
            <Label className="text-gray-300">カレンダー設定（モック）</Label>
            <div className="mt-2 grid grid-cols-7 gap-2 rounded-lg border border-[#2a3553] bg-[#11182c] p-3">
              {calendarPreview.map((cell) => (
                <button key={cell.day} type="button" className={`rounded-md border px-2 py-2 text-xs ${cell.active ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-200' : 'border-[#2a3553] bg-[#0f1424] text-gray-500'}`}>
                  {cell.day}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">日付をポチポチ押して訪問予定を設定するイメージ。今後DBでは定期ルールと個別日を分ける前提。</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">運用情報</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-gray-300">訪問時注意事項</Label><Textarea className="mt-1 min-h-[100px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="暗証番号 / ペット / 配薬場所 / 夜間訪問注意 など" /></div>
          <div><Label className="text-gray-300">保険情報</Label><Textarea className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="保険種別・負担割合など" /></div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-gray-400">
          <div>
            <p>最終更新者: Pharmacy Staff（モック）</p>
            <p>最終更新時刻: 2026-03-28 22:44</p>
          </div>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500"><Save className="h-4 w-4" />保存する（モック）</Button>
        </CardContent>
      </Card>
    </div>
  )
}
