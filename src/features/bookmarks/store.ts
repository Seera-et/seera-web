import { createLocalStore, useStore } from '@/lib/store/createLocalStore'
import type { AnswerCitation, Language } from '@/lib/api'

/**
 * Saved sources and answers, in this browser.
 *
 * A citation bookmark stores the identifiers (`chunkId`, `documentId`,
 * `versionId`) plus enough metadata to render a card offline. It is re-resolved
 * against the API when opened, so a saved bookmark can never show text that has
 * since been superseded without saying so.
 */
export type CitationBookmark = {
  kind: 'citation'
  /** The chunk id — also the bookmark's identity, so saving twice is idempotent. */
  id: string
  documentId: string
  versionId: string
  documentTitle: string
  articleNo: string
  articleTitle: string | null
  sectionPath: string[]
  language: Language | string
  effectiveFrom: string | null
  snippet: string
  savedAt: number
}

export type AnswerBookmark = {
  kind: 'answer'
  id: string
  question: string
  answer: string
  citationCount: number
  abstained: boolean
  savedAt: number
}

export type Bookmark = CitationBookmark | AnswerBookmark

const bookmarksStore = createLocalStore<Bookmark[]>(
  'seera.bookmarks.v1',
  [],
  Array.isArray,
)

export function useBookmarks(): Bookmark[] {
  return useStore(bookmarksStore)
}

export function isBookmarked(bookmarks: Bookmark[], id: string): boolean {
  return bookmarks.some((bookmark) => bookmark.id === id)
}

/**
 * What a source bookmark needs, whichever surface it came from — a citation on
 * an answer, or an article in the document viewer.
 */
export type SourceBookmarkInput = {
  chunkId: string
  documentId: string
  versionId: string
  documentTitle: string
  articleNo: string
  articleTitle: string | null
  sectionPath: string[]
  language: Language | string
  effectiveFrom: string | null
  text: string
}

/** Saves a source, or removes it if it is already saved. Returns the new state. */
export function toggleSourceBookmark(source: SourceBookmarkInput): boolean {
  const existing = bookmarksStore.get().some((item) => item.id === source.chunkId)

  if (existing) {
    removeBookmark(source.chunkId)
    return false
  }

  const bookmark: CitationBookmark = {
    kind: 'citation',
    id: source.chunkId,
    documentId: source.documentId,
    versionId: source.versionId,
    documentTitle: source.documentTitle,
    articleNo: source.articleNo,
    articleTitle: source.articleTitle,
    sectionPath: source.sectionPath,
    language: source.language,
    effectiveFrom: source.effectiveFrom,
    snippet: source.text,
    savedAt: Date.now(),
  }
  bookmarksStore.set((previous) => [bookmark, ...previous])
  return true
}

/** Convenience for the answer surface, where a citation already has the shape. */
export function toggleCitationBookmark(citation: AnswerCitation): boolean {
  return toggleSourceBookmark(citation)
}

export function saveAnswerBookmark(input: {
  question: string
  answer: string
  citationCount: number
  abstained: boolean
}): void {
  const bookmark: AnswerBookmark = {
    kind: 'answer',
    id: crypto.randomUUID(),
    savedAt: Date.now(),
    ...input,
  }
  bookmarksStore.set((previous) => [bookmark, ...previous])
}

export function removeBookmark(id: string): void {
  bookmarksStore.set((previous) => previous.filter((item) => item.id !== id))
}

export function clearBookmarks(): void {
  bookmarksStore.set([])
}
