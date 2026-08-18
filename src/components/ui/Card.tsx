import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Adds a hover lift. Only for cards that are themselves a link or action. */
  interactive?: boolean
  as?: 'div' | 'section' | 'article' | 'li'
}

/**
 * The surface every panel in the app is built from. Composed rather than
 * configured: `<Card><CardHeader>…</CardHeader><CardBody>…</CardBody></Card>`.
 */
export function Card({
  interactive = false,
  as: Tag = 'div',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-card border border-line bg-surface shadow-soft',
        interactive &&
          'transition duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card dark:hover:border-brand-800',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1 p-5 pb-0', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  as: Tag = 'h3',
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { as?: 'h2' | 'h3' | 'h4' }) {
  return (
    <Tag className={cn('text-base font-semibold text-ink', className)} {...props}>
      {children}
    </Tag>
  )
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm leading-relaxed text-ink-soft', className)} {...props}>
      {children}
    </p>
  )
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center gap-3 p-5 pt-0', className)} {...props}>
      {children}
    </div>
  )
}

/** A titled region with a header row that can hold an action on the right. */
export function CardSection({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <CardTitle as="h2" className="text-lg">
            {title}
          </CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}
