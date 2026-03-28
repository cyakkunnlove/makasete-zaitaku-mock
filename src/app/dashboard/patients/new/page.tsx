'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Save, UserPlus } from 'lucide-react'

export default function NewPatientPage() {
  const [visitCount, setVisitCount] = useState('4')

  return (
    <div className="space-y-4 text-gray-100">
      <div>
        <h1 className="text-lg font-semibold text-white flex items-center gap-2"><UserPlus className="h-5 w-5 text-indigo-400" />患者登録（モック）</h1>
        <p className="text-xs text-gray-400">Pharmacy Admin / Pharmacy Staff 向けの登録導線たたき台です。</p>
      </div>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">基本情報</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div><Label className="text-gray-300">氏名</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="山田 花子" /></div>
          <div><Label className="text-gray-300">生年月日</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="1948-04-12" /></div>
          <div className="md:col-span-2"><Label className="text-gray-300">住所</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="東京都八王子市..." /></div>
          <div><Label className="text-gray-300">ステータス</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="利用中" /></div>
          <div><Label className="text-gray-300">担当薬局</Label><Input className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="城南みらい薬局" /></div>
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
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white">運用情報</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label className="text-gray-300">訪問時注意事項</Label><Textarea className="mt-1 min-h-[100px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="暗証番号 / ペット / 配薬場所 / 夜間訪問注意 など" /></div>
          <div><Label className="text-gray-300">今月の訪問回数</Label><Input value={visitCount} onChange={(e) => setVisitCount(e.target.value)} className="mt-1 border-[#2a3553] bg-[#11182c] text-gray-100" /></div>
          {Number(visitCount) > 4 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              月4回を超過しています。保存は可能ですが、超過警告として扱います。
            </div>
          )}
          <div><Label className="text-gray-300">保険情報</Label><Textarea className="mt-1 min-h-[80px] border-[#2a3553] bg-[#11182c] text-gray-100" placeholder="保険種別・負担割合など" /></div>
        </CardContent>
      </Card>

      <Card className="border-[#2a3553] bg-[#1a2035]">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-gray-400">
          <div>
            <p>最終更新者: Pharmacy Staff（モック）</p>
            <p>最終更新時刻: 2026-03-28 22:25</p>
          </div>
          <Button className="bg-indigo-600 text-white hover:bg-indigo-500"><Save className="h-4 w-4" />保存する（モック）</Button>
        </CardContent>
      </Card>
    </div>
  )
}
