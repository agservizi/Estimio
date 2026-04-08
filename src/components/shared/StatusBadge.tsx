import { Badge } from '@/components/ui/badge'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { type VariantProps } from 'class-variance-authority'
import { type badgeVariants } from '@/components/ui/badge'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

const COLOR_TO_VARIANT: Record<string, BadgeVariant> = {
  emerald: 'emerald',
  blue: 'blue',
  amber: 'amber',
  slate: 'slate',
  red: 'destructive',
}

interface StatusBadgeProps {
  status: string
  customLabel?: string
}

export function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const color = getStatusColor(status)
  const label = customLabel ?? getStatusLabel(status)
  const variant = COLOR_TO_VARIANT[color] ?? 'slate'

  return <Badge variant={variant}>{label}</Badge>
}
