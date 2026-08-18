import { FileSearch } from 'lucide-react'
import { Skeleton } from '@/components/ui'
import type { AnswerCitation } from '@/lib/api'
import { CitationCard } from './CitationCard'

/**
 * Every chunk the answer is grounded in, in the order the retriever ranked them.
 *
 * Not rendered at all when there are no sources: a sources panel implying
 * grounding that does not exist is worse than no panel.
 */
export function SourcesPanel({
  citations,
  loading,
  onOpenSource,
}: {
  citations: AnswerCitation[]
  /** Retrieval is still running — show placeholders shaped like source cards. */
  loading: boolean
  onOpenSource: (chunkId: string) => void
}) {
  if (loading && citations.length === 0) {
    return (
      <section className="mt-4">
        <Header count={null} />
        <div className="mt-2 space-y-2">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-card" />
          ))}
        </div>
      </section>
    )
  }

  if (citations.length === 0) return null

  return (
    <section className="mt-4">
      <Header count={citations.length} />
      <ul className="mt-2 space-y-2">
        {citations.map((citation) => (
          <CitationCard
            key={citation.chunkId}
            citation={citation}
            onOpen={onOpenSource}
          />
        ))}
      </ul>
    </section>
  )
}

function Header({ count }: { count: number | null }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
      <FileSearch aria-hidden="true" className="size-3.5" />
      {count === null ? 'Searching the corpus' : `Sources (${count})`}
    </h3>
  )
}
