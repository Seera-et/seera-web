import { ArrowRight, MessageSquare, Sparkles, Target, Type } from 'lucide-react'
import { Badge, ButtonLink, Card } from '@/components/ui'
import type { SearchHit } from '@/lib/api'
import { DOC_TYPE_LABELS } from './labels'
import { documentPath } from './url'
import { Snippet } from './Snippet'

/** How each retrieval arm is described to a reader, and why it mattered. */
const ARM_LABELS: Record<string, { label: string; title: string }> = {
  keyword: {
    label: 'Wording',
    title: 'The provision uses the words you searched for.',
  },
  vector: {
    label: 'Meaning',
    title: 'The provision is about what you asked, in different words.',
  },
  article: {
    label: 'Article number',
    title: 'You named this article directly, so it was looked up rather than ranked.',
  },
  trigram: {
    label: 'Close wording',
    title: 'An approximate match on the wording — used where Amharic cannot be stemmed.',
  },
}

const ARM_ICONS: Record<string, typeof Type> = {
  keyword: Type,
  vector: Sparkles,
  article: Target,
  trigram: Type,
}

/**
 * One matched provision.
 *
 * Shows which arm found it, because that is the difference between "this uses
 * your words" and "this is about your question" — and a reader deciding whether
 * a result is worth opening is really asking exactly that.
 */
export function SearchHitCard({ hit }: { hit: SearchHit }) {
  const isAmharic = hit.language === 'am'
  const heading = hit.articleNo ? `Article ${hit.articleNo}` : 'Provision'

  return (
    <Card as="li" interactive className="flex flex-col gap-2.5 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3
          className="text-sm font-semibold text-ink"
          lang={isAmharic ? 'am' : undefined}
        >
          {heading}
          {hit.articleTitle ? ` — ${hit.articleTitle}` : ''}
        </h3>
      </div>

      <p className="text-xs text-ink-muted">
        <span lang={isAmharic ? 'am' : undefined}>{hit.documentTitle}</span>
        {' · '}
        {DOC_TYPE_LABELS[hit.docType]}
        {hit.sectionPath.length > 0 ? ` · ${hit.sectionPath.join(' › ')}` : ''}
      </p>

      <Snippet
        snippet={hit.snippet}
        lang={isAmharic ? 'am' : undefined}
        className="whitespace-pre-line border-l-2 border-line pl-3 text-sm leading-relaxed text-ink-soft"
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {hit.matchedBy.map((arm) => {
          const meta = ARM_LABELS[arm] ?? { label: arm, title: '' }
          const Icon = ARM_ICONS[arm] ?? Type
          return (
            <Badge key={arm} tone="neutral" icon={<Icon />} title={meta.title}>
              {meta.label}
            </Badge>
          )
        })}

        {/* Version provenance travels with the result. A reader must never have
            to guess whether a hit is current law. */}
        {hit.versionStatus === 'superseded' ? (
          <Badge tone="warning">Superseded version</Badge>
        ) : null}

        {/* `low` means article detection failed at ingestion and this is a
            fixed-size window, not a real provision. Saying so is the difference
            between a weak citation and a misleading one. */}
        {hit.structureConfidence === 'low' ? (
          <Badge tone="warning" title="Article boundaries were not detected in this document, so this is an approximate span rather than a numbered provision.">
            Unstructured span
          </Badge>
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <ButtonLink
          to={documentPath({
            documentId: hit.documentId,
            versionId: hit.versionId,
            articleNo: hit.articleNo,
            chunkId: hit.chunkId ?? undefined,
            // Opens the viewer at this provision instead of the top of the
            // document. Without it, Article 500 of an 823-article code is
            // twenty-five "load more" clicks away.
            from: hit.ordinal,
          })}
          variant="secondary"
          size="sm"
          trailingIcon={<ArrowRight />}
        >
          Read in context
        </ButtonLink>

        <ButtonLink
          to={`/chat?q=${encodeURIComponent(
            `What does ${heading} of the ${hit.documentTitle} mean?`,
          )}`}
          variant="ghost"
          size="sm"
          leadingIcon={<MessageSquare />}
        >
          Ask about it
        </ButtonLink>
      </div>
    </Card>
  )
}
