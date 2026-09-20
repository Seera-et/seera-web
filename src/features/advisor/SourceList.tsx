import { useState } from 'react'
import { ChevronDown, ScrollText } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { RuleSource } from '@/lib/api'
import { documentPath } from '@/features/explorer/url'

/** How a citation reads, in the form a lawyer would write it. */
function citeSource(source: RuleSource): string {
  const article = source.pinpoint || source.articleNo
  return `Article ${article}`
}

/**
 * The provisions a statement rests on, collapsed until asked for.
 *
 * Every rule in the advisor is backed by an article, and the verbatim text is
 * carried in the response — so the reader can check the claim against the law
 * without leaving the page. That is the whole point of the feature: the
 * recommendation is not an opinion to be trusted, it is a rule with a source.
 *
 * A source whose `text` is empty did not resolve in the published corpus. It is
 * shown as unresolved rather than omitted, because a citation that quietly
 * disappears is one nobody notices has broken.
 */
export function SourceList({ sources }: { sources: RuleSource[] }) {
  const [open, setOpen] = useState(false)

  if (sources.length === 0) return null

  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
      >
        <ScrollText aria-hidden="true" className="size-3.5" />
        {sources.length === 1 ? '1 provision' : `${sources.length} provisions`}
        <ChevronDown
          aria-hidden="true"
          className={open ? 'size-3.5 rotate-180 transition-transform' : 'size-3.5 transition-transform'}
        />
      </button>

      {open ? (
        <ul className="mt-2 space-y-2">
          {sources.map((source) => (
            <li
              key={`${source.articleNo}-${source.pinpoint ?? ''}-${source.facet ?? ''}`}
              className="border-l-2 border-brand-300 bg-surface-accent/50 p-3 dark:border-brand-800"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="text-xs font-semibold text-ink">
                  {citeSource(source)}
                  {source.articleTitle ? ` — ${source.articleTitle}` : ''}
                </p>
                <a
                  href={documentPath({
                    documentId: source.documentId,
                    articleNo: source.articleNo,
                    chunkId: source.chunkId ?? undefined,
                  })}
                  className="text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
                >
                  Read in {source.documentTitle}
                </a>
              </div>

              {source.text ? (
                <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-ink-soft">
                  {source.text}
                </p>
              ) : (
                <Badge tone="warning" className="mt-1.5">
                  This article did not resolve in the indexed corpus
                </Badge>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
