import { cn } from '@/lib/utils/cn'

type SpinnerProps = {
  className?: string
  /** Announced to assistive tech. Omit inside a control that already says it. */
  label?: string
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <>
      <svg
        className={cn('size-5 animate-spin text-current', className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          className="opacity-25"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </>
  )
}
