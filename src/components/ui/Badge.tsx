import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type BadgeTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger'

const tones: Record<BadgeTone, string> = {
  brand:
    'bg-surface-accent text-brand-700 border-brand-100 dark:text-brand-200 dark:border-brand-900',
  neutral: 'bg-surface-sunken text-ink-soft border-line',
  success:
    'bg-success-50 text-success-700 border-success-500/20 dark:bg-success-500/10 dark:text-success-500',
  warning:
    'bg-warning-50 text-warning-700 border-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500',
  danger:
    'bg-danger-50 text-danger-700 border-danger-500/20 dark:bg-danger-500/10 dark:text-danger-500',
}

type BadgeProps = {
  tone?: BadgeTone
  icon?: ReactNode
  className?: string
  children: ReactNode
}

/** Small status label. Always carries text — colour is never the only signal. */
export function Badge({ tone = 'neutral', icon, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1',
        'text-xs font-medium [&_svg]:size-3.5 [&_svg]:shrink-0',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
