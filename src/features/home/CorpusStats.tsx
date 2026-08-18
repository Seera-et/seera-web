import { BookOpenCheck, CalendarClock, FileText, Layers } from 'lucide-react'
import { Card, ErrorState, StatCard } from '@/components/ui'
import { useCorpusStats } from '@/lib/api/queries'
import { formatDate, formatNumber } from '@/lib/utils/format'

/**
 * What the corpus actually contains.
 *
 * Every figure is counted by the API over published versions — the same set
 * retrieval can see — so the number here is a claim the system can stand behind.
 * Nothing is padded, rounded up, or invented: on an empty corpus these read zero,
 * which is the honest answer.
 */
export function CorpusStats() {
  const { data, isPending, isError, error, refetch } = useCorpusStats()

  if (isError) {
    return (
      <Card>
        <ErrorState error={error} onRetry={() => void refetch()} className="py-8" />
      </Card>
    )
  }

  const lastUpdated = formatDate(data?.lastPublishedAt)
  const amharic = data?.languages.find((stat) => stat.language === 'am')

  return (
    <section aria-labelledby="corpus-stats-heading" className="space-y-2">
      <h2 id="corpus-stats-heading" className="sr-only">
        Corpus statistics
      </h2>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<FileText />}
          loading={isPending}
          value={formatNumber(data?.documents ?? 0)}
          label="Legal documents"
        />
        <StatCard
          icon={<Layers />}
          loading={isPending}
          value={formatNumber(data?.articles ?? 0)}
          label="Articles indexed"
        />
        <StatCard
          icon={<BookOpenCheck />}
          loading={isPending}
          value={formatNumber(amharic?.articles ?? 0)}
          label="Amharic articles"
        />
        <StatCard
          icon={<CalendarClock />}
          loading={isPending}
          value={lastUpdated ?? '—'}
          label="Last published"
        />
      </div>

      {data && data.documents === 0 ? (
        <p className="text-xs text-ink-muted">
          Nothing is published yet, so Seera will decline every question rather than
          guess. Ingest a document and it becomes browsable and answerable at the
          same moment.
        </p>
      ) : null}
    </section>
  )
}
