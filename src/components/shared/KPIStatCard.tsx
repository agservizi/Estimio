import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { cardHover } from '@/lib/motion'

interface KPIStatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  iconColor?: string
  loading?: boolean
  suffix?: string
  className?: string
}

export function KPIStatCard({
  title,
  value,
  change,
  changeLabel = 'vs. mese scorso',
  icon: Icon,
  iconColor = 'brand',
  loading = false,
  suffix,
  className,
}: KPIStatCardProps) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    slate: 'bg-slate-100 text-slate-500',
  }

  const isPositive = change !== undefined && change >= 0

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-5 shadow-card', className)}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    )
  }

  return (
    <motion.div
      {...cardHover}
      className={cn(
        'group rounded-xl border border-border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-default',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', colorMap[iconColor] ?? colorMap.brand)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-foreground leading-none">
          {value}
          {suffix && <span className="text-sm font-medium text-muted-foreground ml-1">{suffix}</span>}
        </p>
      </div>

      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-3 w-3 text-emerald-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              isPositive ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            {isPositive ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">{changeLabel}</span>
        </div>
      )}
    </motion.div>
  )
}
