import type { AnswerSummary } from '@/lib/api'
import { formatDuration } from '@/lib/utils/format'

/**
 * The measured facts about an answer: which model, which reranker, how long each
 * stage took. Collapsed by default — it is not what a user came for, but on a
 * grounded-answer product it should always be available.
 */
export function AnswerMeta({ summary }: { summary: AnswerSummary }) {
  const rows: Array<[string, string]> = [
    ['Model', summary.model || 'not reported'],
    ['Reranker', summary.reranker || 'none'],
    ['Retrieval', formatDuration(summary.timings.retrieval)],
    ['Rerank', formatDuration(summary.timings.rerank)],
    ['First token', formatDuration(summary.timings.firstToken)],
    ['Total', formatDuration(summary.timings.total)],
    ['Candidates', String(summary.timings.candidates)],
    ['Context chunks', String(summary.timings.contextChunks)],
  ]

  return (
    <details className="mt-3 border-t border-line pt-2.5">
      <summary className="cursor-pointer list-none text-xs font-medium text-ink-muted hover:text-ink">
        Answer details
      </summary>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-ink-muted">{label}</dt>
            <dd className="truncate text-ink-soft" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {summary.requestId ? (
        <p className="mt-2 text-xs text-ink-muted">
          Request ID <code className="font-mono">{summary.requestId}</code>
        </p>
      ) : null}
    </details>
  )
}
