/** Presentation-only helpers. No business or legal logic lives here. */

import type { CitationBase } from '@/lib/api'

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

/**
 * Formats an API date. Accepts both shapes the backend emits: `YYYY-MM-DD` on
 * the answer stream and RFC3339 from the citation endpoint.
 */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return dateFormatter.format(parsed)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

/** `840ms`, `2.1s`. Latency is read at a glance, so it stays short. */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
]

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelativeTime(value: string | number | Date): string {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) return '—'
  const diff = time - Date.now()
  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= size) {
      return relativeFormatter.format(Math.round(diff / size), unit)
    }
  }
  return 'just now'
}

/**
 * The human label for a citation: what the user reads on a source card and what
 * a screen reader announces for an inline marker.
 */
export function citationLabel(citation: CitationBase): string {
  const article = citation.articleNo ? `Article ${citation.articleNo}` : null
  return [citation.documentTitle, article].filter(Boolean).join(', ')
}

/** Ethiopic block. Used to set `lang="am"` on generated text, which has no
 * language field of its own — citations carry theirs. */
const ETHIOPIC = /[ሀ-፿]/

export function looksAmharic(text: string): boolean {
  return ETHIOPIC.test(text)
}

/** `lang` attribute value for a block of text, or undefined to inherit. */
export function langAttr(text: string): 'am' | undefined {
  return looksAmharic(text) ? 'am' : undefined
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

/** Initials for an avatar. Never more than two characters. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
