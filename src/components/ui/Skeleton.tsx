import { cn } from '@/lib/utils/cn'

/**
 * A placeholder shaped like the content that is coming. Skeletons, not spinners
 * — the layout must not jump when the real thing arrives.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-lg bg-surface-sunken', className)}
    />
  )
}

/** Text-shaped skeleton: n lines, last one short, like a real paragraph. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn('h-3.5', index === lines - 1 ? 'w-2/5' : 'w-full')}
        />
      ))}
    </div>
  )
}
