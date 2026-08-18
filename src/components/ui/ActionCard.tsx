import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Card, CardDescription, CardTitle } from './Card'
import { ButtonLink } from './Button'
import { IconTile } from './IconTile'

/**
 * A feature card with a call to action — the "Explore Seera" grid, and the
 * next-step cards on About.
 *
 * The whole card is not a link: the CTA is, so the description stays selectable
 * and there is exactly one tab stop with an accurate label.
 */
export function ActionCard({
  icon,
  title,
  description,
  cta,
  to,
}: {
  icon: ReactNode
  title: string
  description: string
  cta: string
  to: string
}) {
  return (
    <Card interactive className="flex h-full flex-col gap-3 p-5">
      <IconTile>{icon}</IconTile>
      <div className="flex-1 space-y-1.5">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <ButtonLink
        to={to}
        variant="secondary"
        size="sm"
        className="w-full justify-between"
        trailingIcon={<ArrowRight />}
      >
        {cta}
      </ButtonLink>
    </Card>
  )
}
