import { cn } from '@/lib/utils/cn'

export type Tab<T extends string> = {
  value: T
  label: string
  /** Shown after the label, e.g. a result count. */
  count?: number
}

type TabsProps<T extends string> = {
  label: string
  value: T
  tabs: readonly Tab<T>[]
  onChange: (value: T) => void
  className?: string
}

/**
 * Underlined tabs, matching the top navigation's active treatment.
 *
 * Presentational only: the parent owns the value, which on a page-level switch
 * should come from a URL search param so the view is shareable.
 */
export function Tabs<T extends string>({
  label,
  value,
  tabs,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex items-center gap-1 border-b border-line', className)}
    >
      {tabs.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative -mb-px flex min-h-11 items-center gap-2 border-b-2 px-3.5 text-sm font-medium',
              'transition-colors duration-150 ease-out-soft',
              selected
                ? 'border-brand-600 text-brand-700 dark:text-brand-300'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {tab.label}
            {tab.count === undefined ? null : (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs',
                  selected
                    ? 'bg-surface-accent text-brand-700 dark:text-brand-200'
                    : 'bg-surface-sunken text-ink-muted',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
