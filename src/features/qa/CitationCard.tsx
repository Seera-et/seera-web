import { Bookmark, BookmarkCheck, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card } from '@/components/ui'
import type { AnswerCitation } from '@/lib/api'
import { formatDate, truncate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import {
  isBookmarked,
  toggleCitationBookmark,
  useBookmarks,
} from '@/features/bookmarks/store'
import { markerNumber } from './markers'

/**
 * One grounding source.
 *
 * Shows document, article, version date and language every time — a citation the
 * reader cannot date is not much of a citation.
 */
export function CitationCard({
  citation,
  onOpen,
  className,
}: {
  citation: AnswerCitation
  onOpen: (chunkId: string) => void
  className?: string
}) {
  const bookmarks = useBookmarks()
  const saved = isBookmarked(bookmarks, citation.chunkId)
  const ordinal = markerNumber(citation.marker)
  const effective = formatDate(citation.effectiveFrom)
  const isAmharic = citation.language === 'am'

  return (
    <Card as="li" className={cn('p-4', className)}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-accent text-xs font-semibold text-brand-700 dark:text-brand-200"
        >
          {ordinal ?? '·'}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-ink">
            {citation.documentTitle}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {citation.articleNo ? `Article ${citation.articleNo}` : 'Unnumbered section'}
            {citation.articleTitle ? ` — ${citation.articleTitle}` : ''}
          </p>

          {citation.sectionPath.length > 0 ? (
            <p className="mt-1 truncate text-xs text-ink-muted">
              {citation.sectionPath.join(' › ')}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{isAmharic ? 'አማርኛ' : 'English'}</Badge>
            {effective ? (
              <Badge tone="neutral">In force from {effective}</Badge>
            ) : (
              <Badge tone="neutral">Effective date not recorded</Badge>
            )}
            {citation.issuingAuthority ? (
              <Badge tone="neutral">{truncate(citation.issuingAuthority, 28)}</Badge>
            ) : null}
            {citation.structureConfidence === 'low' ? (
              <Badge tone="warning" icon={<TriangleAlert />}>
                Approximate boundary
              </Badge>
            ) : null}
          </div>

          <p
            lang={isAmharic ? 'am' : undefined}
            className="mt-2.5 text-xs leading-relaxed text-ink-soft"
          >
            {truncate(citation.text, 280)}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => onOpen(citation.chunkId)}>
              View source
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCitationBookmark(citation)}
              leadingIcon={saved ? <BookmarkCheck /> : <Bookmark />}
              aria-pressed={saved}
            >
              {saved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
