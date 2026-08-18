import { initials } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/** Initials avatar. No image source yet — auth is not wired. */
export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'bg-brand-600 font-semibold text-white',
        size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm',
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
