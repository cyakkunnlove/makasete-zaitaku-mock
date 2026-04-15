import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export const adminPageClass = 'space-y-5 text-slate-900'
export const adminCardClass = 'border-slate-200 bg-white text-slate-900 shadow-sm'
export const adminMutedCardClass = 'border-slate-200 bg-slate-50 text-slate-900 shadow-sm'
export const adminInputClass = 'border-slate-300 bg-white text-slate-900 placeholder:text-slate-400'
export const adminPanelClass = 'rounded-xl border border-slate-200 bg-slate-50 text-slate-900 shadow-sm'
export const adminTableClass = 'border-slate-200 bg-white text-slate-900 shadow-sm'
export const adminDialogClass = 'border-slate-200 bg-white text-slate-900 shadow-xl'

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions}
    </div>
  )
}

export function AdminStatCard({
  label,
  value,
  tone = 'default',
  icon,
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary'
  icon?: ReactNode
}) {
  const toneClass = {
    default: 'text-slate-900',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
    primary: 'text-indigo-600',
  }[tone]

  return (
    <Card className={adminCardClass}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-slate-500">{label}</p>
            <p className={cn('mt-2 text-2xl font-semibold', toneClass)}>{value}</p>
          </div>
          {icon ? <div className="text-slate-400">{icon}</div> : null}
        </div>
      </CardContent>
    </Card>
  )
}
