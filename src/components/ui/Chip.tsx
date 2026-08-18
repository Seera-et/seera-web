import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { chipClasses } from './variants'

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Filled when this chip represents the current selection. */
  selected?: boolean
}

/**
 * A tappable pill: suggested questions, filter values. A real button, so it is
 * keyboard-reachable, and ≥44px tall for touch.
 */
export function Chip({ selected = false, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected ? true : undefined}
      className={chipClasses(selected, className)}
      {...props}
    >
      {children}
    </button>
  )
}

/** The same pill, for when activating it navigates rather than acts. */
export function ChipLink({ className, children, ...props }: LinkProps) {
  return (
    <Link className={chipClasses(false, className)} {...props}>
      {children}
    </Link>
  )
}
