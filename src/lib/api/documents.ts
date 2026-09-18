/**
 * The corpus catalogue: what has been ingested, and what is inside it.
 *
 * Read-only, and published versions only — the same set retrieval can see, so a
 * document that appears here is a document an answer can cite.
 */

import { API_PREFIX } from './config'
import { requestJson } from './http'
import {
  articlePageSchema,
  corpusSearchSchema,
  corpusStatsSchema,
  documentDetailSchema,
  documentListSchema,
} from './schemas'
import type {
  ArticlePage,
  CorpusSearch,
  CorpusStats,
  DocumentDetail,
  DocumentList,
  DocumentQuery,
  SearchQuery,
} from './types'

export function getCorpusStats(signal?: AbortSignal): Promise<CorpusStats> {
  return requestJson(`${API_PREFIX}/corpus/stats`, corpusStatsSchema, { signal })
}

export function listDocuments(
  query: DocumentQuery = {},
  signal?: AbortSignal,
): Promise<DocumentList> {
  const params = new URLSearchParams()
  if (query.term) params.set('q', query.term)
  if (query.language) params.set('language', query.language)
  if (query.docType) params.set('type', query.docType)
  if (query.domain) params.set('domain', query.domain)
  if (query.year) params.set('year', String(query.year))
  if (query.limit !== undefined) params.set('limit', String(query.limit))
  if (query.offset) params.set('offset', String(query.offset))

  const search = params.toString()
  return requestJson(
    `${API_PREFIX}/documents${search ? `?${search}` : ''}`,
    documentListSchema,
    { signal },
  )
}

/**
 * Search inside the corpus: ranked provisions, not a list of documents.
 *
 * `listDocuments` answers "which laws are there"; this answers "which
 * provisions are about this". Separate calls because they are separate
 * questions with differently shaped answers, and the backend ranks only this
 * one.
 */
export function searchCorpus(
  query: SearchQuery,
  signal?: AbortSignal,
): Promise<CorpusSearch> {
  const params = new URLSearchParams({ q: query.term })
  if (query.mode) params.set('mode', query.mode)
  if (query.language) params.set('language', query.language)
  if (query.docType) params.set('type', query.docType)
  if (query.domain) params.set('domain', query.domain)
  if (query.year) params.set('year', String(query.year))
  if (query.documentId) params.set('document', query.documentId)
  if (query.includeSuperseded) params.set('include_superseded', 'true')
  if (query.limit !== undefined) params.set('limit', String(query.limit))
  if (query.offset) params.set('offset', String(query.offset))

  return requestJson(
    `${API_PREFIX}/documents/search?${params.toString()}`,
    corpusSearchSchema,
    { signal },
  )
}

export function getDocument(
  documentId: string,
  signal?: AbortSignal,
): Promise<DocumentDetail> {
  return requestJson(
    `${API_PREFIX}/documents/${encodeURIComponent(documentId)}`,
    documentDetailSchema,
    { signal },
  )
}

/**
 * One page of a version's articles.
 *
 * Keyset paginated on `ordinal`: pass the previous page's `nextAfter` to
 * continue. Omitting `versionId` reads the published version.
 */
export function getArticles(
  documentId: string,
  options: { versionId?: string; after?: number; limit?: number } = {},
  signal?: AbortSignal,
): Promise<ArticlePage> {
  const params = new URLSearchParams()
  if (options.versionId) params.set('version', options.versionId)
  if (options.after) params.set('after', String(options.after))
  if (options.limit !== undefined) params.set('limit', String(options.limit))

  const search = params.toString()
  return requestJson(
    `${API_PREFIX}/documents/${encodeURIComponent(documentId)}/articles${
      search ? `?${search}` : ''
    }`,
    articlePageSchema,
    { signal },
  )
}
