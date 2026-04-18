import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function ErrorState({ title = '表示に失敗しました', description, action, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-6 py-12 text-center shadow-sm', className)}>
      <div className="mb-3 rounded-full border border-rose-200 bg-white p-3 text-rose-500">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-rose-900">{title}</p>
      {description ? <p className="mt-1 text-sm text-rose-700">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
