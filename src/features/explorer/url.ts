/**
 * Explorer and document-viewer URLs.
 *
 * The document view is deep-linkable — `/documents/:id?version=&article=&chunk=`
 * — so a citation can be shared and land on the exact provision, at the exact
 * version, that an answer relied on.
 */

export const DOC_PARAM = {
  version: 'version',
  article: 'article',
  chunk: 'chunk',
} as const

export const EXPLORER_PARAM = {
  query: 'q',
  language: 'lang',
  type: 'type',
  page: 'page',
} as const

export function documentPath(input: {
  documentId: string
  versionId?: string
  articleNo?: string
  chunkId?: string
}): string {
  const params = new URLSearchParams()
  if (input.versionId) params.set(DOC_PARAM.version, input.versionId)
  if (input.articleNo) params.set(DOC_PARAM.article, input.articleNo)
  if (input.chunkId) params.set(DOC_PARAM.chunk, input.chunkId)
  const search = params.toString()
  return `/documents/${encodeURIComponent(input.documentId)}${search ? `?${search}` : ''}`
}
