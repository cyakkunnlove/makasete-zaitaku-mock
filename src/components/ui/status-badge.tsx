import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StatusMeta } from '@/lib/status-meta'

type StatusBadgeProps = {
  meta: StatusMeta
  className?: string
}

export function StatusBadge({ meta, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('border text-xs', meta.className, className)}>
      {meta.label}
    </Badge>
  )
}
