import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

/** The title block every page except Home starts with. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? <div className="flex items-center gap-2">{eyebrow}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
