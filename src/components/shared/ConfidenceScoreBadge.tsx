import { cn, formatScore, getConfidenceLabel } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

interface ConfidenceScoreBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ConfidenceScoreBadge({
  score,
  showLabel = true,
  size = 'md',
  className,
}: ConfidenceScoreBadgeProps) {
  const { label, color } = getConfidenceLabel(score)

  const colorClasses: Record<string, { bg: string; text: string; ring: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
    red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' },
  }

  const cls = colorClasses[color] ?? colorClasses.amber
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full ring-1',
        cls.bg, cls.text, cls.ring,
        sizeClasses[size],
        className
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      <span className="font-semibold">{formatScore(score)}</span>
      {showLabel && <span className="font-normal opacity-80">· {label}</span>}
    </div>
  )
}
