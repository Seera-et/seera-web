/** Public surface of the API layer. Features import from here, not from files. */

export { API_BASE_URL, endpoints } from './config'
export { ApiError, isAbortError, type ApiErrorKind } from './errors'
export { getCitation } from './citations'
export {
  getArticles,
  getCorpusStats,
  getDocument,
  listDocuments,
} from './documents'
export { getHealth } from './health'
export { streamAnswer, type QaStreamHandlers } from './qa'
export type {
  AnswerCitation,
  AnswerKind,
  AnswerSummary,
  AnswerTimings,
  ArticlePage,
  ArticleRecord,
  AskInput,
  CitationBase,
  CorpusStats,
  DocType,
  DocumentDetail,
  DocumentList,
  DocumentQuery,
  DocumentSummary,
  DocumentVersion,
  HealthStatus,
  HistoryTurn,
  Language,
  ResolvedCitation,
  StructureConfidence,
  VersionStatus,
} from './types'
