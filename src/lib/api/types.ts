/**
 * Domain types for the frontend. camelCase mirrors of the Go DTOs in
 * seera-backend-services/internal/{qa,rag,citations}.
 *
 * The wire shape is snake_case; the translation happens once, in schemas.ts, at
 * the boundary. Nothing below this line knows the wire format exists.
 */

export type Language = 'en' | 'am'

/** How the chunk was located during ingestion. `low` = window fallback, which is
 * a weaker citation and is labelled as such in the UI. */
export type StructureConfidence = 'high' | 'low'

/** Fields every citation carries, whichever endpoint it came from. */
export type CitationBase = {
  chunkId: string
  articleId: string
  versionId: string
  documentId: string
  documentTitle: string
  issuingAuthority: string | null
  articleNo: string
  articleTitle: string | null
  sectionPath: string[]
  language: Language | string
  /** Verbatim source text of the cited chunk. Never model-generated. */
  text: string
}

/** A citation as it arrives on the answer stream (`sources` / `done` events). */
export type AnswerCitation = CitationBase & {
  /** The marker the model was told to use, e.g. `S1`. */
  marker: string
  /** ISO date (YYYY-MM-DD) or null when the version has no recorded start. */
  effectiveFrom: string | null
  structureConfidence: StructureConfidence | null
}

/** A citation resolved through GET /api/v1/citations/{id}: adds version
 * provenance and the offsets the source viewer highlights. */
export type ResolvedCitation = CitationBase & {
  versionLabel: string
  /** RFC3339 timestamp or null. */
  effectiveFrom: string | null
  repealedAt: string | null
  pageNo: number
  charStart: number
  charEnd: number
  /** Official publication location, for verification only. Never how a citation
   * resolves. */
  sourceUrl: string | null
}

/** Per-stage latency, in milliseconds. */
export type AnswerTimings = {
  /** Routing and the follow-up rewrite. Zero when the router was not consulted. */
  condense: number
  retrieval: number
  /** Second retrieval pass. Zero unless multi-hop is enabled. */
  expand: number
  /** How many provisions came from earlier in the conversation. */
  carriedSources: number
  rerank: number
  firstToken: number
  total: number
  candidates: number
  contextChunks: number
}

/**
 * What sort of reply this was.
 *
 * `conversation` is a reply to a message that was not a legal question — a
 * greeting, or a question about what Seera does. It carries no citations because
 * it makes no claim about the law, and must not be shown as a grounded answer.
 *
 * `insufficient` is the case in between: provisions were retrieved and read, and
 * they do not settle the question. Sources are worth showing; "Grounded" is not
 * the badge for it.
 */
export type AnswerKind =
  | 'legal'
  | 'insufficient'
  | 'abstention'
  | 'conversation'

/** Which engine the router chose. */
export type AnswerIntent = 'legal' | 'discussion' | 'general'

/** How much the answer was asked to explain. */
export type AnswerDepth = 'quote' | 'explain' | 'analyse'

/**
 * The `route` event: what the router decided, before retrieval starts.
 *
 * `searchText` is present only when it differs from what the reader typed. A
 * rewrite they cannot see is a rewrite they cannot correct.
 */
export type RouteInfo = {
  intent: AnswerIntent | string
  depth: AnswerDepth | null
  searchText: string | null
  carriedSources: number
}

/** A follow-up question offered with an answer. Built from the citations. */
export type Suggestion = {
  question: string
}

/** The `done` event: everything known about a finished answer. */
export type AnswerSummary = {
  kind: AnswerKind
  /** Generation hit the output limit; the answer stops mid-sentence. */
  truncated: boolean
  intent: AnswerIntent | string | null
  depth: AnswerDepth | null
  /** Follow-up questions built from the citations this answer used. */
  related: Suggestion[]
  citations: AnswerCitation[]
  /** True when retrieval found nothing usable and the system declined to guess. */
  abstained: boolean
  /** True when every legal claim in the answer carried a valid marker. */
  grounded: boolean
  timings: AnswerTimings
  model: string
  reranker: string
  requestId: string | null
}

export type HealthStatus = {
  status: 'ok' | 'degraded' | string
  db: 'up' | 'down' | string
}

/** One earlier exchange, sent with a follow-up question. */
export type HistoryTurn = {
  role: 'user' | 'assistant'
  text: string
}

/** Body of POST /api/v1/qa/query. */
export type AskInput = {
  question: string
  /** Restricts sources to one language. Omit to search both. */
  language?: Language
  /** `YYYY-MM-DD`. Asks what the law was on that date. Omit for today. */
  asOf?: string
  /**
   * The conversation this question continues, oldest first.
   *
   * The server stores no conversation, so a follow-up carries the turns it
   * depends on. The backend rewrites the question into a standalone form for
   * retrieval and treats these turns as context, never as grounding.
   */
  history?: HistoryTurn[]

  /**
   * Chunk ids of the citations the client is displaying, so a follow-up can be
   * about provisions already on screen. Identifiers only — the server reads the
   * text from the database.
   */
  contextChunks?: string[]
}

/* ---------- Catalogue ---------- */

export type DocType =
  | 'proclamation'
  | 'regulation'
  | 'directive'
  | 'code'
  | 'other'

export type VersionStatus = 'draft' | 'published' | 'superseded'

export type DocumentVersion = {
  id: string
  label: string
  status: VersionStatus
  effectiveFrom: string | null
  repealedAt: string | null
  publishedAt: string | null
  articleCount: number
}

export type DocumentSummary = {
  id: string
  title: string
  docType: DocType
  legalDomain: string | null
  issuingAuthority: string | null
  language: Language | string
  publicationDate: string | null
  effectiveDate: string | null
  sourceUrl: string | null
  /** The published version this entry describes. */
  version: DocumentVersion
}

export type DocumentList = {
  documents: DocumentSummary[]
  total: number
  limit: number
  offset: number
}

export type DocumentDetail = {
  document: DocumentSummary
  /** Published first, then superseded. Drafts are never returned. */
  versions: DocumentVersion[]
}

export type ArticleRecord = {
  id: string
  articleNo: string
  articleNoRaw: string | null
  title: string | null
  chapter: string | null
  sectionPath: string[]
  text: string
  ordinal: number
  pageNo: number
  charStart: number
  charEnd: number
  structureConfidence: StructureConfidence
  /** First retrievable chunk, or null when the article was never indexed. */
  chunkId: string | null
}

export type ArticlePage = {
  version: DocumentVersion
  articles: ArticleRecord[]
  total: number
  /** Cursor for the next page, or null at the end. */
  nextAfter: number | null
}

export type DocumentQuery = {
  term?: string
  language?: Language
  docType?: DocType
  limit?: number
  offset?: number
}

export type LanguageStat = {
  language: Language | string
  documents: number
  articles: number
}

export type DocTypeStat = {
  docType: DocType
  documents: number
}

/** What the corpus contains, counted over published versions only. */
export type CorpusStats = {
  documents: number
  versions: number
  articles: number
  chunks: number
  languages: LanguageStat[]
  docTypes: DocTypeStat[]
  lastPublishedAt: string | null
}
