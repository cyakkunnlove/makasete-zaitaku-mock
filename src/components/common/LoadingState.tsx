import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoadingStateProps = {
  message?: string
  className?: string
}

export function LoadingState({ message = '読み込み中です。', className }: LoadingStateProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-slate-500', className)}>
      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
      <span>{message}</span>
    </div>
  )
}
