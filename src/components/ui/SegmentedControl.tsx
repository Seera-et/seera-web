import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils/cn'

export type Segment<T extends string> = {
  value: T
  label: string
  /** Full label for assistive tech when `label` is an abbreviation ("አማ"). */
  srLabel?: string
}

type SegmentedControlProps<T extends string> = {
  /** Names the group for screen readers, e.g. "Source language". */
  label: string
  value: T
  segments: readonly Segment<T>[]
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}

/**
 * A small exclusive choice — the language filter, a view switch.
 *
 * A radiogroup rather than a row of buttons, so the current value is announced
 * as a selection. Arrow keys move between options, as a native radio group does;
 * only the selected option is in the tab order.
 */
export function SegmentedControl<T extends string>({
  label,
  value,
  segments,
  onChange,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  const groupRef = useRef<HTMLDivElement>(null)

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (step === 0) return

    event.preventDefault()
    const index = segments.findIndex((segment) => segment.value === value)
    const next = segments[(index + step + segments.length) % segments.length]
    onChange(next.value)
    // Focus follows selection, which is what a radio group does.
    const radios = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    radios?.item(segments.indexOf(next))?.focus()
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border border-line bg-surface-sunken p-0.5',
        className,
      )}
    >
      {segments.map((segment) => {
        const selected = segment.value === value
        return (
          <button
            key={segment.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(segment.value)}
            className={cn(
              'rounded-full font-medium transition-colors duration-150 ease-out-soft',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
              selected
                ? 'bg-surface text-ink shadow-soft'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {segment.label}
            {segment.srLabel ? <span className="sr-only"> {segment.srLabel}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
