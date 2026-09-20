/** Public surface of the API layer. Features import from here, not from files. */

export { API_BASE_URL, endpoints } from './config'
export { ApiError, isAbortError, type ApiErrorKind } from './errors'
export { getBusinessIntake, requestAdvice } from './business'
export { getAccount } from './account'
export { getCitation } from './citations'
export {
  getArticles,
  getCorpusStats,
  getDocument,
  listDocuments,
  searchCorpus,
} from './documents'
export { SNIPPET_HIGHLIGHT_END, SNIPPET_HIGHLIGHT_START } from './types'
export { getHealth } from './health'
export { streamAnswer, type QaStreamHandlers } from './qa'
export type {
  Account,
  AnswerCitation,
  AnswerConfidence,
  AnswerConfidenceLevel,
  AnswerDepth,
  AnswerIntent,
  AnswerKind,
  AnswerSummary,
  AnswerTimings,
  ArticlePage,
  ArticleRecord,
  AskInput,
  AdviseInput,
  BusinessActivity,
  BusinessCandidate,
  BusinessIntakeForm,
  BusinessReason,
  BusinessRecommendation,
  BusinessRequirement,
  BusinessStructure,
  CitationBase,
  CorpusSearch,
  CorpusStats,
  DocType,
  DocumentDetail,
  DocumentList,
  DocumentQuery,
  DocumentSummary,
  DocumentVersion,
  DomainStat,
  HealthStatus,
  HistoryTurn,
  Language,
  ReasonCode,
  ResolvedCitation,
  RouteInfo,
  RuleFacet,
  RuleSource,
  SearchHit,
  SearchMode,
  SearchQuery,
  StructureConfidence,
  Suggestion,
  VersionStatus,
} from './types'
