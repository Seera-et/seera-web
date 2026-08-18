import type { SelectHTMLAttributes } from 'react'
import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export type SelectOption = { value: string; label: string }

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'children'> & {
  label: string
  options: readonly SelectOption[]
  hideLabel?: boolean
  wrapperClassName?: string
}

/**
 * A native select. Deliberately not a custom listbox: the native one is
 * keyboard-accessible, screen-reader-correct and usable on mobile for free, and
 * nothing in the design needs more.
 */
export function Select({
  label,
  options,
  hideLabel = false,
  wrapperClassName,
  className,
  ...props
}: SelectProps) {
  const id = useId()

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      <label
        htmlFor={id}
        className={cn('text-sm font-medium text-ink', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          className={cn(
            'h-11 w-full appearance-none rounded-control border border-line bg-surface',
            'pl-3.5 pr-9 text-sm text-ink transition-colors hover:border-line-strong',
            'focus:border-brand-400 focus:outline-none',
            className,
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        />
      </div>
    </div>
  )
}
