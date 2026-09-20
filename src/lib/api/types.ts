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

/**
 * How much evidence backs an answer, read from retrieval/reranking signals
 * already produced — never an extra model call. Only meaningful for `kind:
 * 'legal'` answers; absent (`null`) on insufficient/abstention/conversation
 * results, which never reach the point in the answer path where it's computed.
 */
export type AnswerConfidenceLevel = 'high' | 'medium' | 'low'

export type AnswerConfidence = {
  level: AnswerConfidenceLevel
  /** At least one source came from a deterministic article-number lookup,
   * not a similarity judgement. */
  exactMatch: boolean
  sourceCount: number
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
  confidence: AnswerConfidence | null
}

export type HealthStatus = {
  status: 'ok' | 'degraded' | string
  db: 'up' | 'down' | string
}

/** The caller's Seera account, from GET /api/v1/me. */
export type Account = {
  id: string
  email: string
  displayName: string
  avatarUrl: string
  createdAt: string
  lastSeenAt: string
  /**
   * True when this call created the account. With Google there is no separate
   * sign-up step, so first sign-in is registration, and this is the only signal
   * that distinguishes a new account from a returning one.
   */
  isNew: boolean
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
  /** Exact legal domain, as offered by `CorpusStats.domains`. */
  domain?: string
  /** Publication or effective year. */
  year?: number
  limit?: number
  offset?: number
}

/* ---------- Corpus search ---------- */

/**
 * Which retrieval arms rank a search.
 *
 * `keyword` finds the term a lawyer typed; `semantic` finds the provision a
 * citizen described without using its words. They genuinely disagree — a query
 * like "how much money must I put in to start a business" returns nothing
 * lexically and the capital provisions semantically — so the choice is exposed
 * rather than hidden. `hybrid` fuses both and is the default.
 */
export type SearchMode = 'hybrid' | 'keyword' | 'semantic'

/**
 * Markers the server wraps matched terms in, inside `SearchHit.snippet`.
 *
 * Private Use Area codepoints, not HTML: the snippet is split on these and
 * rendered as elements, so legal text never reaches an HTML parser. Must match
 * `HighlightStart`/`HighlightEnd` in
 * seera-backend-services/internal/documents/search.go.
 */
export const SNIPPET_HIGHLIGHT_START = '\ue000'
export const SNIPPET_HIGHLIGHT_END = '\ue001'

/** One article matched by a corpus search. */
export type SearchHit = {
  documentId: string
  documentTitle: string
  docType: DocType
  issuingAuthority: string | null
  language: Language | string

  versionId: string
  versionLabel: string
  versionStatus: VersionStatus

  articleId: string
  articleNo: string
  articleTitle: string | null
  chapter: string | null
  sectionPath: string[]
  /** Position in the version — the cursor the document viewer opens at. */
  ordinal: number

  /** First retrievable chunk, or null when the article was never indexed. */
  chunkId: string | null

  /**
   * Matched text with the highlight markers around the terms. On a
   * semantic-only hit there is nothing lexical to mark and this is the opening
   * of the provision instead, which is why it is never labelled as "the
   * matching sentence".
   */
  snippet: string

  structureConfidence: StructureConfidence

  /** Fused rank score. Comparable only within one response; not a percentage. */
  score: number

  /**
   * Which arms found this hit. Agreement between lexical and semantic
   * retrieval is the strongest signal either produces.
   */
  matchedBy: string[]
}

export type CorpusSearch = {
  hits: SearchHit[]
  /**
   * How many articles were ranked — the pool these pages slice, not a
   * corpus-wide count of everything that would ever match.
   */
  total: number
  /** Matches exist beyond the ranked pool, so `total` is a floor, not a count. */
  capped: boolean
  /**
   * The mode that actually ran. A deployment with no embedding provider serves
   * a hybrid request as keyword-only, and says so here rather than pretending.
   */
  mode: SearchMode
  /** Article numbers recognised in the query, if any. */
  articleRefs: string[]
  limit: number
  offset: number
}

export type SearchQuery = {
  term: string
  mode?: SearchMode
  language?: Language
  docType?: DocType
  domain?: string
  year?: number
  documentId?: string
  includeSuperseded?: boolean
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

/** One legal domain and how much of the corpus sits in it — the browse
 * categories, derived from what was ingested rather than a fixed taxonomy. */
export type DomainStat = {
  domain: string
  documents: number
  articles: number
}

/** What the corpus contains, counted over published versions only. */
export type CorpusStats = {
  documents: number
  versions: number
  articles: number
  chunks: number
  languages: LanguageStat[]
  docTypes: DocTypeStat[]
  /** Browse categories. Excludes documents ingested without a domain. */
  domains: DomainStat[]
  lastPublishedAt: string | null
}

/* ---------- Business & License Advisor ---------- */

/** Which part of a rule a citation supports. */
export type RuleFacet =
  | 'general'
  | 'members'
  | 'capital'
  | 'liability'
  | 'public_shares'

/**
 * One provision a rule rests on.
 *
 * `text` is the article's verbatim text, resolved server-side from the
 * published corpus. Empty means the cited article did not resolve — shown as
 * such rather than hidden, because an uncitable rule is one the reader cannot
 * check.
 */
export type RuleSource = {
  documentId: string
  documentTitle: string
  articleNo: string
  /** Sub-article, where naming it helps ("495/4"). */
  pinpoint: string | null
  facet: RuleFacet | string | null
  chunkId: string | null
  articleTitle: string | null
  text: string | null
}

/** One legal form a business may take. */
export type BusinessStructure = {
  code: string
  name: string
  nameSuffix: string | null
  summary: string | null
  liability: string | null
  /**
   * null means the indexed corpus does not establish the bound — which is not
   * the same as "no limit", and the UI must not render it as one.
   */
  minMembers: number | null
  maxMembers: number | null
  minCapital: number | null
  minSharePar: number | null
  currency: string | null
  allowsPublicSubscription: boolean | null
  sources: RuleSource[]
}

export type BusinessActivity = {
  code: string
  name: string
  /** A sector needing a licence beyond ordinary commercial registration. */
  regulated: boolean
  sources: RuleSource[]
}

export type RequirementKind = 'step' | 'licence' | 'caveat'

export type BusinessRequirement = {
  kind: RequirementKind
  structureCode: string | null
  activityCode: string | null
  title: string
  detail: string | null
  authority: string | null
  sources: RuleSource[]
}

/** Why a rule reached its conclusion. Codes, so the UI can style a
 * disqualification differently from a preference. */
export type ReasonCode =
  | 'members_below_minimum'
  | 'members_above_maximum'
  | 'members_within_range'
  | 'member_limit_unknown'
  | 'capital_below_minimum'
  | 'capital_sufficient'
  | 'capital_unknown'
  | 'capital_not_established'
  | 'public_shares_not_allowed'
  | 'public_shares_allowed'
  | 'limited_liability_match'
  | 'limited_liability_mismatch'

export type BusinessReason = {
  code: ReasonCode | string
  message: string
  /** True where the finding rules the form out entirely. */
  disqualifying: boolean
  sources: RuleSource[]
}

export type BusinessCandidate = {
  structure: BusinessStructure
  eligible: boolean
  reasons: BusinessReason[]
}

/**
 * The advisor's answer.
 *
 * Contains no generated prose. Every sentence is either a rule's own reason or
 * the verbatim text of a provision, which is why there is no streaming
 * contract here as there is for Q&A.
 */
export type BusinessRecommendation = {
  ruleSetId: string
  ruleSetLabel: string
  /** null when the answers rule out every form — an answer, not an error. */
  recommended: BusinessCandidate | null
  alternatives: BusinessCandidate[]
  excluded: BusinessCandidate[]
  steps: BusinessRequirement[]
  licences: BusinessRequirement[]
  caveats: BusinessRequirement[]
  /** What the reader asked about that this corpus cannot answer. */
  unsupported: string[]
}

export type BusinessIntakeForm = {
  ruleSetId: string
  ruleSetLabel: string
  activities: BusinessActivity[]
  structures: BusinessStructure[]
  unsupported: string[]
}

/** Body of POST /api/v1/business/advisor. */
export type AdviseInput = {
  founders: number
  activityCode?: string
  /** Omit for "not sure" — never sent as 0, which means something else. */
  capitalBirr?: number
  wantsLimitedLiability?: boolean
  raiseFromPublic?: boolean
  foreignOwnership?: boolean
}
