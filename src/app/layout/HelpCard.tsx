import { BookOpen } from 'lucide-react'
import { ButtonLink, Card, IconTile } from '@/components/ui'

/** The right rail help prompt from the design. Links to the About page, which is
 * where the "how citations work" explanation actually lives. */
export function HelpCard() {
  return (
    <Card className="relative overflow-hidden p-4">
      <p className="text-sm font-semibold text-ink">Need help?</p>
      <p className="mt-1 max-w-[15rem] text-xs leading-relaxed text-ink-soft">
        Learn how to get the best answers and how to read a citation.
      </p>
      <ButtonLink
        to="/about"
        variant="secondary"
        size="sm"
        className="mt-4"
        leadingIcon={<BookOpen />}
      >
        View help guide
      </ButtonLink>
      <IconTile
        size="lg"
        className="absolute -bottom-4 -right-4 size-24 rounded-full opacity-60"
      >
        <BookOpen className="size-8" />
      </IconTile>
    </Card>
  )
}
