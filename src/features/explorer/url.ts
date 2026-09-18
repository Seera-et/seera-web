/**
 * Explorer and document-viewer URLs.
 *
 * The document view is deep-linkable — `/documents/:id?version=&article=&chunk=&from=`
 * — so a citation can be shared and land on the exact provision, at the exact
 * version, that an answer relied on.
 *
 * Explorer state lives in the query string for the same reason: a filtered
 * search is shareable, survives a reload, and can be navigated back to.
 */

export const DOC_PARAM = {
  version: 'version',
  article: 'article',
  chunk: 'chunk',
  /**
   * Ordinal to start paging the article list from, exclusive.
   *
   * A deep link into a long code needs this: the article list is keyset
   * paginated from the beginning, so a link to Article 500 without a starting
   * cursor lands the reader at Article 1.
   */
  from: 'from',
} as const

export const EXPLORER_PARAM = {
  query: 'q',
  language: 'lang',
  type: 'type',
  domain: 'domain',
  year: 'year',
  page: 'page',
  /** `documents` (the catalogue) or `provisions` (ranked search). */
  scope: 'in',
  /** Ranking mode for provision search. */
  mode: 'mode',
} as const

/** What a search is looking for: whole laws, or provisions inside them. */
export type ExplorerScope = 'documents' | 'provisions'

export function isScope(value: string | null): value is ExplorerScope {
  return value === 'documents' || value === 'provisions'
}

export function documentPath(input: {
  documentId: string
  versionId?: string
  articleNo?: string
  chunkId?: string
  from?: number
}): string {
  const params = new URLSearchParams()
  if (input.versionId) params.set(DOC_PARAM.version, input.versionId)
  if (input.articleNo) params.set(DOC_PARAM.article, input.articleNo)
  if (input.chunkId) params.set(DOC_PARAM.chunk, input.chunkId)
  // An ordinal of 1 is the first article, and paging "after 0" is what shows
  // it — so the cursor is one before the target.
  if (input.from !== undefined && input.from > 1) {
    params.set(DOC_PARAM.from, String(input.from - 1))
  }
  const search = params.toString()
  return `/documents/${encodeURIComponent(input.documentId)}${search ? `?${search}` : ''}`
}
