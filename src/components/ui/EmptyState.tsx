import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { IconTile } from './IconTile'

/**
 * "Nothing here" — a first-class result, not a failure. Styled neutrally on
 * purpose: an abstention or an empty search is information, and must never look
 * like an error.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className,
      )}
    >
      <IconTile size="lg" tone="neutral">
        {icon}
      </IconTile>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">{description}</p>
      ) : null}
      {action ? <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  )
}
