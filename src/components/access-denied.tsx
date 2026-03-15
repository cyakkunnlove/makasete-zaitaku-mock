import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

export function AccessDenied({
  title = 'アクセス権限がありません',
  description = 'この画面は現在のロールでは閲覧できません。',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-lg border-[#2a3553] bg-[#1a2035] text-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-400">{description}</p>
          <Link href="/dashboard">
            <Button className="bg-indigo-500 text-white hover:bg-indigo-500/90">ダッシュボードへ戻る</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
