import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { Spinner } from './Spinner'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './variants'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Shows a spinner and blocks interaction. Keeps the label, so width is stable. */
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
}

type ButtonLinkProps = LinkProps & {
  variant?: ButtonVariant
  size?: ButtonSize
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

/** A call to action that navigates. An anchor, not a button with an onClick —
 * middle-click and "open in new tab" have to work. */
export function ButtonLink({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  )
}
