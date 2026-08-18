import type { ReactNode } from 'react'
import { AlertTriangle, Info, ShieldAlert, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type CalloutTone = 'info' | 'brand' | 'warning' | 'danger'

const tones: Record<CalloutTone, { box: string; icon: ReactNode }> = {
  info: {
    box: 'border-line bg-surface-sunken text-ink-soft',
    icon: <Info />,
  },
  brand: {
    box: 'border-brand-100 bg-surface-accent text-brand-800 dark:border-brand-900 dark:text-brand-200',
    icon: <Sparkles />,
  },
  warning: {
    box: 'border-warning-500/25 bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500',
    icon: <AlertTriangle />,
  },
  danger: {
    box: 'border-danger-500/25 bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-500',
    icon: <ShieldAlert />,
  },
}

/** An inline notice: the legal disclaimer, an abstention explanation, a caveat. */
export function Callout({
  tone = 'info',
  title,
  icon,
  className,
  children,
}: {
  tone?: CalloutTone
  title?: string
  icon?: ReactNode
  className?: string
  children?: ReactNode
}) {
  const { box, icon: defaultIcon } = tones[tone]

  return (
    <div
      className={cn(
        'flex gap-3 rounded-card border p-4 text-sm leading-relaxed',
        '[&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
        box,
        className,
      )}
    >
      {icon ?? defaultIcon}
      <div className="min-w-0 space-y-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children}
      </div>
    </div>
  )
}
