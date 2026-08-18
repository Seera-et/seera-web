import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export type IconTileTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger'
export type IconTileSize = 'sm' | 'md' | 'lg'

const tones: Record<IconTileTone, string> = {
  brand: 'bg-surface-accent text-brand-600 dark:text-brand-300',
  neutral: 'bg-surface-sunken text-ink-soft',
  success: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500',
  danger: 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-500',
}

const sizes: Record<IconTileSize, string> = {
  sm: 'size-8 rounded-lg [&_svg]:size-4',
  md: 'size-10 rounded-xl [&_svg]:size-5',
  lg: 'size-12 rounded-xl [&_svg]:size-6',
}

/** The soft square that sits above a card title or beside a stat. */
export function IconTile({
  tone = 'brand',
  size = 'md',
  className,
  children,
}: {
  tone?: IconTileTone
  size?: IconTileSize
  className?: string
  children: ReactNode
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        tones[tone],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
