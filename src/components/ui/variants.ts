/**
 * Class recipes shared between a component and its link twin (`Button` /
 * `ButtonLink`, `Chip` / `ChipLink`), so the two can never drift apart.
 *
 * They live outside the component files because a module that exports both a
 * component and a helper cannot be hot-reloaded reliably.
 */

import { cn } from '@/lib/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-control font-medium ' +
  'whitespace-nowrap transition-colors duration-150 ease-out-soft ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  '[&_svg]:size-4 [&_svg]:shrink-0'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-lift hover:bg-brand-700 active:bg-brand-800',
  secondary:
    'border border-line bg-surface text-ink shadow-soft hover:border-line-strong hover:bg-surface-sunken',
  subtle: 'bg-surface-accent text-brand-700 hover:bg-brand-100 dark:text-brand-200',
  ghost: 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
  danger: 'bg-danger-500 text-white hover:bg-danger-700',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'size-11',
  'icon-sm': 'size-9',
}

export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)
}

export function chipClasses(selected = false, className?: string): string {
  return cn(
    'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2',
    'text-left text-sm transition-colors duration-150 ease-out-soft',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    selected
      ? 'border-brand-300 bg-brand-600 text-white'
      : 'border-brand-100 bg-surface-accent text-brand-700 hover:border-brand-300 hover:bg-brand-100 dark:border-brand-900 dark:text-brand-200 dark:hover:bg-brand-900/60',
    className,
  )
}
