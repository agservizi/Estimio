import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/10 text-destructive border-destructive/20',
        outline: 'text-foreground border-border',
        emerald: 'border-transparent bg-emerald-100 text-emerald-700 border-emerald-200',
        amber: 'border-transparent bg-amber-100 text-amber-700 border-amber-200',
        blue: 'border-transparent bg-blue-100 text-blue-700 border-blue-200',
        slate: 'border-transparent bg-slate-100 text-slate-600 border-slate-200',
        brand: 'border-transparent bg-brand-100 text-brand-700 border-brand-200',
        red: 'border-transparent bg-red-100 text-red-700 border-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
