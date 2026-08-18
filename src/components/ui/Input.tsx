import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/utils/cn'

const field =
  'w-full rounded-control border border-line bg-surface px-3.5 text-sm text-ink ' +
  'placeholder:text-ink-muted transition-colors duration-150 ' +
  'hover:border-line-strong focus:border-brand-400 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

type FieldWrapperProps = {
  label?: string
  hint?: string
  error?: string
  /** Hides the label visually but keeps it for screen readers. */
  hideLabel?: boolean
  children: (props: { id: string; describedBy: string | undefined }) => ReactNode
  className?: string
}

/** Label, hint and error wiring, shared by every field so none of it is
 * forgotten on one form. */
function Field({
  label,
  hint,
  error,
  hideLabel = false,
  className,
  children,
}: FieldWrapperProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            'text-sm font-medium text-ink',
            hideLabel && 'sr-only',
          )}
        >
          {label}
        </label>
      ) : null}
      {children({ id, describedBy })}
      {error ? (
        <p id={errorId} className="text-xs text-danger-700 dark:text-danger-500">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label?: string
  hint?: string
  error?: string
  hideLabel?: boolean
  leadingIcon?: ReactNode
  trailingSlot?: ReactNode
  wrapperClassName?: string
}

export function Input({
  label,
  hint,
  error,
  hideLabel,
  leadingIcon,
  trailingSlot,
  wrapperClassName,
  className,
  ...props
}: InputProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      className={wrapperClassName}
    >
      {({ id, describedBy }) => (
        <div className="relative flex items-center">
          {leadingIcon ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 text-ink-muted [&_svg]:size-4"
            >
              {leadingIcon}
            </span>
          ) : null}
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={cn(
              field,
              'h-11',
              leadingIcon && 'pl-10',
              trailingSlot && 'pr-11',
              error && 'border-danger-500',
              className,
            )}
            {...props}
          />
          {trailingSlot ? (
            <span className="absolute right-2 flex items-center">{trailingSlot}</span>
          ) : null}
        </div>
      )}
    </Field>
  )
}

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label?: string
  hint?: string
  error?: string
  hideLabel?: boolean
  wrapperClassName?: string
}

export function Textarea({
  label,
  hint,
  error,
  hideLabel,
  wrapperClassName,
  className,
  ...props
}: TextareaProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      className={wrapperClassName}
    >
      {({ id, describedBy }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(
            field,
            'resize-none py-3 leading-relaxed',
            error && 'border-danger-500',
            className,
          )}
          {...props}
        />
      )}
    </Field>
  )
}
