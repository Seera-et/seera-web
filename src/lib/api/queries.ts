/**
 * Server-state hooks.
 *
 * One place that says how each resource is fetched, keyed and cached, so a
 * component asks for data instead of orchestrating a request. Query keys include
 * every input that changes the result — anything less serves one document's
 * articles under another document's key.
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getCitation } from './citations'
import {
  getArticles,
  getCorpusStats,
  getDocument,
  listDocuments,
  searchCorpus,
} from './documents'
import { getHealth } from './health'
import type { ArticlePage, DocumentQuery, SearchQuery } from './types'

/** Cache keys, in one hierarchy so a prefix can invalidate a whole area. */
export const queryKeys = {
  health: ['health'] as const,
  corpusStats: ['corpus', 'stats'] as const,
  documents: (query: DocumentQuery) => ['documents', 'list', query] as const,
  document: (id: string) => ['documents', 'detail', id] as const,
  articles: (id: string, versionId: string | null, from: number) =>
    ['documents', 'articles', id, versionId, from] as const,
  corpusSearch: (query: SearchQuery) => ['documents', 'search', query] as const,
  citation: (chunkId: string) => ['citations', chunkId] as const,
}

/**
 * The corpus is append-only and changes only on ingestion, so cached catalogue
 * data can be considered fresh for minutes rather than seconds.
 */
const CORPUS_STALE_MS = 5 * 60 * 1000

export function useCorpusStats() {
  return useQuery({
    queryKey: queryKeys.corpusStats,
    queryFn: ({ signal }) => getCorpusStats(signal),
    staleTime: CORPUS_STALE_MS,
  })
}

export function useDocuments(query: DocumentQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.documents(query),
    queryFn: ({ signal }) => listDocuments(query, signal),
    staleTime: CORPUS_STALE_MS,
    enabled,
    // Keeps the previous page on screen while a filter change loads, instead of
    // collapsing the list to a spinner on every keystroke.
    placeholderData: (previous) => previous,
  })
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: queryKeys.document(documentId),
    queryFn: ({ signal }) => getDocument(documentId, signal),
    staleTime: CORPUS_STALE_MS,
    enabled: documentId !== '',
  })
}

/**
 * A version's articles, page by page.
 *
 * Infinite rather than offset-paged because the viewer reads a document
 * top-to-bottom: the cursor is the last ordinal served, which stays correct even
 * if the corpus is re-ingested underneath.
 *
 * `from` starts that cursor somewhere other than the beginning, which is what
 * makes a search hit on Article 500 of a 823-article code openable. Without it
 * the reader would have to page through twenty-five pages to reach the provision
 * they clicked. It is part of the query key because two different starting
 * points are two different result sets, not one cache entry.
 */
export function useArticles(
  documentId: string,
  versionId: string | null,
  from = 0,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.articles(documentId, versionId, from),
    queryFn: ({ pageParam, signal }) =>
      getArticles(
        documentId,
        { versionId: versionId ?? undefined, after: pageParam },
        signal,
      ),
    initialPageParam: from,
    getNextPageParam: (lastPage: ArticlePage) => lastPage.nextAfter ?? undefined,
    staleTime: CORPUS_STALE_MS,
    enabled: documentId !== '',
  })
}

/**
 * Ranked provisions for a search.
 *
 * Not cached as long as the catalogue: the ranking depends on whether the
 * embedding provider answered, so a result that arrived keyword-only should not
 * be served for minutes as though it were the hybrid one.
 */
export function useCorpusSearch(query: SearchQuery, enabled = true) {
  return useQuery({
    queryKey: queryKeys.corpusSearch(query),
    queryFn: ({ signal }) => searchCorpus(query, signal),
    staleTime: 30_000,
    enabled: enabled && query.term.trim() !== '',
    // Keeps the previous results visible while the next page or a changed
    // filter loads, rather than collapsing to a spinner on every keystroke.
    placeholderData: (previous) => previous,
  })
}

export function useCitation(chunkId: string | null) {
  return useQuery({
    queryKey: queryKeys.citation(chunkId ?? ''),
    queryFn: ({ signal }) => getCitation(chunkId as string, signal),
    // A published version's text never changes, so a resolved citation is good
    // for the session.
    staleTime: Infinity,
    enabled: chunkId !== null,
  })
}

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: ({ signal }) => getHealth(signal),
    // A backend that went down should show up without a reload.
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  })
}
