import { useState } from 'react'
import type { AnswerCitation } from '@/lib/api'
import { citationLabel, truncate } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { markerNumber } from './markers'

/**
 * An inline citation marker.
 *
 * A `<button>` with a full label — "Source 3: Commercial Code, Article 627" — not
 * a bare superscript number, so a screen reader user learns what the claim rests
 * on without leaving the sentence. Hover or focus previews the source text;
 * activating it opens the source panel.
 */
export function CitationMarker({
  citation,
  onOpen,
}: {
  citation: AnswerCitation
  onOpen: (chunkId: string) => void
}) {
  const [previewing, setPreviewing] = useState(false)
  const ordinal = markerNumber(citation.marker) ?? 0
  const label = `Source ${ordinal}: ${citationLabel(citation)}`

  return (
    <span className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => onOpen(citation.chunkId)}
        onMouseEnter={() => setPreviewing(true)}
        onMouseLeave={() => setPreviewing(false)}
        onFocus={() => setPreviewing(true)}
        onBlur={() => setPreviewing(false)}
        aria-label={label}
        className={cn(
          'mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1',
          'align-[0.1em] text-xs font-semibold tabular-nums',
          'bg-surface-accent text-brand-700 transition-colors',
          'hover:bg-brand-600 hover:text-white dark:text-brand-200',
        )}
      >
        {ordinal}
      </button>

      {previewing ? (
        <span
          role="tooltip"
          className={cn(
            'absolute bottom-full left-1/2 z-30 mb-2 w-72 -translate-x-1/2',
            'animate-fade-in rounded-card border border-line bg-surface p-3 shadow-float',
          )}
        >
          <span className="block text-xs font-semibold text-ink">
            {citationLabel(citation)}
          </span>
          <span
            lang={citation.language === 'am' ? 'am' : undefined}
            className="mt-1 block text-xs leading-relaxed text-ink-soft"
          >
            {truncate(citation.text, 260)}
          </span>
        </span>
      ) : null}
    </span>
  )
}
