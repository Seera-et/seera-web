/**
 * Wire validation. Every response is parsed here before it reaches a component,
 * so a backend contract change fails loudly in one file instead of surfacing as
 * `undefined` inside a citation card.
 */

import { z } from 'zod'
import { ApiError } from './errors'
import type {
  Account,
  AnswerCitation,
  AnswerConfidence,
  AnswerSummary,
  AnswerTimings,
  ArticlePage,
  ArticleRecord,
  CorpusSearch,
  CorpusStats,
  DocumentDetail,
  DocumentList,
  DocumentSummary,
  DocumentVersion,
  HealthStatus,
  ResolvedCitation,
  RouteInfo,
  SearchHit,
  StructureConfidence,
  BusinessActivity,
  BusinessCandidate,
  BusinessIntakeForm,
  BusinessRecommendation,
  BusinessReason,
  BusinessRequirement,
  BusinessStructure,
  RuleSource,
} from './types'

/** `omitempty` on the Go side means the key is absent, not null — accept both. */
const nullableString = z
  .string()
  .nullish()
  .transform((value) => value ?? null)

const stringList = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? [])

const structureConfidence = z
  .enum(['high', 'low'])
  .nullish()
  .transform((value) => (value ?? null) as StructureConfidence | null)

/** The `done` event's top-level `confidence` — a different concept from a
 * citation's `structure_confidence` above, despite the similar name. */
const confidenceSchema = z
  .object({
    level: z.enum(['high', 'medium', 'low']),
    exact_match: z.boolean().nullish(),
    source_count: z.number().int().nullish(),
  })
  .nullish()
  .transform(
    (raw): AnswerConfidence | null =>
      raw
        ? {
            level: raw.level,
            exactMatch: raw.exact_match ?? false,
            sourceCount: raw.source_count ?? 0,
          }
        : null,
  )

/** Shared by rag.Citation and citations.Citation — the JSON names match by design. */
const citationBaseShape = {
  chunk_id: z.string(),
  article_id: z.string(),
  version_id: z.string(),
  document_id: z.string(),
  document_title: z.string(),
  issuing_authority: nullableString,
  article_no: z.string(),
  article_title: nullableString,
  section_path: stringList,
  language: z.string(),
  text: z.string(),
}

export const answerCitationSchema = z
  .object({
    ...citationBaseShape,
    marker: z.string(),
    effective_from: nullableString,
    structure_confidence: structureConfidence,
  })
  .transform(
    (raw): AnswerCitation => ({
      marker: raw.marker,
      chunkId: raw.chunk_id,
      articleId: raw.article_id,
      versionId: raw.version_id,
      documentId: raw.document_id,
      documentTitle: raw.document_title,
      issuingAuthority: raw.issuing_authority,
      articleNo: raw.article_no,
      articleTitle: raw.article_title,
      sectionPath: raw.section_path,
      language: raw.language,
      effectiveFrom: raw.effective_from,
      text: raw.text,
      structureConfidence: raw.structure_confidence,
    }),
  )

export const resolvedCitationSchema = z
  .object({
    ...citationBaseShape,
    version_label: z.string(),
    effective_from: nullableString,
    repealed_at: nullableString,
    page_no: z.number().int(),
    char_start: z.number().int(),
    char_end: z.number().int(),
    source_url: nullableString,
  })
  .transform(
    (raw): ResolvedCitation => ({
      chunkId: raw.chunk_id,
      articleId: raw.article_id,
      versionId: raw.version_id,
      documentId: raw.document_id,
      documentTitle: raw.document_title,
      issuingAuthority: raw.issuing_authority,
      articleNo: raw.article_no,
      articleTitle: raw.article_title,
      sectionPath: raw.section_path,
      language: raw.language,
      text: raw.text,
      versionLabel: raw.version_label,
      effectiveFrom: raw.effective_from,
      repealedAt: raw.repealed_at,
      pageNo: raw.page_no,
      charStart: raw.char_start,
      charEnd: raw.char_end,
      sourceUrl: raw.source_url,
    }),
  )

const timingsSchema = z
  .object({
    condense: z.number(),
    retrieval: z.number(),
    expand: z.number(),
    carried_sources: z.number(),
    rerank: z.number(),
    first_token: z.number(),
    total: z.number(),
    candidates: z.number(),
    context_chunks: z.number(),
  })
  .partial()
  .transform(
    (raw): AnswerTimings => ({
      condense: raw.condense ?? 0,
      retrieval: raw.retrieval ?? 0,
      expand: raw.expand ?? 0,
      carriedSources: raw.carried_sources ?? 0,
      rerank: raw.rerank ?? 0,
      firstToken: raw.first_token ?? 0,
      total: raw.total ?? 0,
      candidates: raw.candidates ?? 0,
      contextChunks: raw.context_chunks ?? 0,
    }),
  )

/* ---------- SSE event payloads ---------- */

export const sourcesEventSchema = z.object({
  citations: z.array(answerCitationSchema).nullish(),
})

export const tokenEventSchema = z.object({
  text: z.string(),
})

export const doneEventSchema = z
  .object({
    // Absent on a backend older than the conversational path; a legal answer is
    // the only thing it could have been.
    kind: z.enum(['legal', 'insufficient', 'abstention', 'conversation']).nullish(),
    truncated: z.boolean().nullish(),
    intent: nullableString,
    depth: z.enum(['quote', 'explain', 'analyse']).nullish(),
    related: z
      .array(z.object({ question: z.string() }))
      .nullish(),
    citations: z.array(answerCitationSchema).nullish(),
    abstained: z.boolean().nullish(),
    grounded: z.boolean().nullish(),
    timings_ms: timingsSchema.nullish(),
    model: nullableString,
    reranker: nullableString,
    request_id: nullableString,
    confidence: confidenceSchema,
  })
  .transform(
    (raw): AnswerSummary => ({
      kind: raw.kind ?? 'legal',
      truncated: raw.truncated ?? false,
      intent: raw.intent,
      depth: raw.depth ?? null,
      related: raw.related ?? [],
      citations: raw.citations ?? [],
      abstained: raw.abstained ?? false,
      grounded: raw.grounded ?? false,
      timings: raw.timings_ms ?? {
        condense: 0,
        retrieval: 0,
        expand: 0,
        carriedSources: 0,
        rerank: 0,
        firstToken: 0,
        total: 0,
        candidates: 0,
        contextChunks: 0,
      },
      model: raw.model ?? '',
      reranker: raw.reranker ?? '',
      requestId: raw.request_id,
      confidence: raw.confidence,
    }),
  )

/** The `route` event, emitted before retrieval. */
export const routeEventSchema = z
  .object({
    intent: z.string(),
    depth: z.enum(['quote', 'explain', 'analyse']).nullish(),
    search_text: nullableString,
    carried_sources: z.number().nullish(),
  })
  .transform(
    (raw): RouteInfo => ({
      intent: raw.intent,
      depth: raw.depth ?? null,
      searchText: raw.search_text,
      carriedSources: raw.carried_sources ?? 0,
    }),
  )

export const errorEventSchema = z.object({
  code: z.string(),
  message: z.string(),
  request_id: nullableString,
})

/* ---------- Catalogue ---------- */

const docTypeSchema = z.enum([
  'proclamation',
  'regulation',
  'directive',
  'code',
  'other',
])

const versionSchema = z
  .object({
    id: z.string(),
    version_label: z.string(),
    status: z.enum(['draft', 'published', 'superseded']),
    effective_from: nullableString,
    repealed_at: nullableString,
    published_at: nullableString,
    article_count: z.number().int(),
  })
  .transform(
    (raw): DocumentVersion => ({
      id: raw.id,
      label: raw.version_label,
      status: raw.status,
      effectiveFrom: raw.effective_from,
      repealedAt: raw.repealed_at,
      publishedAt: raw.published_at,
      articleCount: raw.article_count,
    }),
  )

const documentSummarySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    doc_type: docTypeSchema,
    legal_domain: nullableString,
    issuing_authority: nullableString,
    language: z.string(),
    publication_date: nullableString,
    effective_date: nullableString,
    source_url: nullableString,
    version: versionSchema,
  })
  .transform(
    (raw): DocumentSummary => ({
      id: raw.id,
      title: raw.title,
      docType: raw.doc_type,
      legalDomain: raw.legal_domain,
      issuingAuthority: raw.issuing_authority,
      language: raw.language,
      publicationDate: raw.publication_date,
      effectiveDate: raw.effective_date,
      sourceUrl: raw.source_url,
      version: raw.version,
    }),
  )

export const documentListSchema = z
  .object({
    documents: z.array(documentSummarySchema).nullish(),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .transform(
    (raw): DocumentList => ({
      documents: raw.documents ?? [],
      total: raw.total,
      limit: raw.limit,
      offset: raw.offset,
    }),
  )

export const documentDetailSchema = z
  .object({
    document: documentSummarySchema,
    versions: z.array(versionSchema).nullish(),
  })
  .transform(
    (raw): DocumentDetail => ({
      document: raw.document,
      versions: raw.versions ?? [],
    }),
  )

const articleSchema = z
  .object({
    id: z.string(),
    article_no: z.string(),
    article_no_raw: nullableString,
    title: nullableString,
    chapter: nullableString,
    section_path: stringList,
    text: z.string(),
    ordinal: z.number().int(),
    page_no: z.number().int(),
    char_start: z.number().int(),
    char_end: z.number().int(),
    structure_confidence: structureConfidence,
    chunk_id: nullableString,
  })
  .transform(
    (raw): ArticleRecord => ({
      id: raw.id,
      articleNo: raw.article_no,
      articleNoRaw: raw.article_no_raw,
      title: raw.title,
      chapter: raw.chapter,
      sectionPath: raw.section_path,
      text: raw.text,
      ordinal: raw.ordinal,
      pageNo: raw.page_no,
      charStart: raw.char_start,
      charEnd: raw.char_end,
      structureConfidence: raw.structure_confidence ?? 'high',
      chunkId: raw.chunk_id,
    }),
  )

export const articlePageSchema = z
  .object({
    version: versionSchema,
    articles: z.array(articleSchema).nullish(),
    total: z.number().int(),
    next_after: z.number().int().nullish(),
  })
  .transform(
    (raw): ArticlePage => ({
      version: raw.version,
      articles: raw.articles ?? [],
      total: raw.total,
      nextAfter: raw.next_after ?? null,
    }),
  )

export const corpusStatsSchema = z
  .object({
    documents: z.number().int(),
    versions: z.number().int(),
    articles: z.number().int(),
    chunks: z.number().int(),
    languages: z
      .array(
        z.object({
          language: z.string(),
          documents: z.number().int(),
          articles: z.number().int(),
        }),
      )
      .nullish(),
    doc_types: z
      .array(z.object({ doc_type: docTypeSchema, documents: z.number().int() }))
      .nullish(),
    domains: z
      .array(
        z.object({
          domain: z.string(),
          documents: z.number().int(),
          articles: z.number().int(),
        }),
      )
      .nullish(),
    last_published_at: nullableString,
  })
  .transform(
    (raw): CorpusStats => ({
      documents: raw.documents,
      versions: raw.versions,
      articles: raw.articles,
      chunks: raw.chunks,
      languages: raw.languages ?? [],
      docTypes: (raw.doc_types ?? []).map((stat) => ({
        docType: stat.doc_type,
        documents: stat.documents,
      })),
      domains: raw.domains ?? [],
      lastPublishedAt: raw.last_published_at,
    }),
  )

/* ---------- Corpus search ---------- */

const searchModeSchema = z.enum(['hybrid', 'keyword', 'semantic'])

const searchHitSchema = z
  .object({
    document_id: z.string(),
    document_title: z.string(),
    doc_type: docTypeSchema,
    issuing_authority: nullableString,
    language: z.string(),

    version_id: z.string(),
    version_label: z.string(),
    version_status: z.enum(['draft', 'published', 'superseded']),

    article_id: z.string(),
    article_no: z.string(),
    article_title: nullableString,
    chapter: nullableString,
    section_path: stringList,
    ordinal: z.number().int(),

    chunk_id: nullableString,
    snippet: z.string(),
    structure_confidence: structureConfidence,
    score: z.number(),
    matched_by: stringList,
  })
  .transform(
    (raw): SearchHit => ({
      documentId: raw.document_id,
      documentTitle: raw.document_title,
      docType: raw.doc_type,
      issuingAuthority: raw.issuing_authority,
      language: raw.language,
      versionId: raw.version_id,
      versionLabel: raw.version_label,
      versionStatus: raw.version_status,
      articleId: raw.article_id,
      articleNo: raw.article_no,
      articleTitle: raw.article_title,
      chapter: raw.chapter,
      sectionPath: raw.section_path,
      ordinal: raw.ordinal,
      chunkId: raw.chunk_id,
      snippet: raw.snippet,
      structureConfidence: raw.structure_confidence ?? 'high',
      score: raw.score,
      matchedBy: raw.matched_by,
    }),
  )

export const corpusSearchSchema = z
  .object({
    hits: z.array(searchHitSchema).nullish(),
    total: z.number().int(),
    capped: z.boolean().nullish(),
    mode: searchModeSchema,
    article_refs: stringList,
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .transform(
    (raw): CorpusSearch => ({
      hits: raw.hits ?? [],
      total: raw.total,
      capped: raw.capped ?? false,
      mode: raw.mode,
      articleRefs: raw.article_refs,
      limit: raw.limit,
      offset: raw.offset,
    }),
  )

/* ---------- JSON responses ---------- */

export const healthSchema = z
  .object({ status: z.string(), db: z.string() })
  .transform((raw): HealthStatus => ({ status: raw.status, db: raw.db }))

export const accountSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    display_name: z.string(),
    avatar_url: z.string(),
    created_at: z.string(),
    last_seen_at: z.string(),
    is_new: z.boolean(),
  })
  .transform(
    (raw): Account => ({
      id: raw.id,
      email: raw.email,
      displayName: raw.display_name,
      avatarUrl: raw.avatar_url,
      createdAt: raw.created_at,
      lastSeenAt: raw.last_seen_at,
      isNew: raw.is_new,
    }),
  )

/** The error envelope every JSON failure uses: `{"error":{code,message,request_id}}`. */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    request_id: nullableString,
  }),
})

/**
 * Parses a payload or raises a `contract` ApiError. A schema mismatch is a bug
 * in the contract, not something the user can retry, and it is reported that way.
 */
export function parseOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  what: string,
): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError({
      kind: 'contract',
      code: 'unexpected_response',
      message: `The API returned a ${what} the app does not understand. This is a version mismatch between seera-web and seera-backend-services.`,
      cause: result.error,
    })
  }
  return result.data
}

/* ---------- Business & License Advisor ---------- */

const ruleSourceSchema = z
  .object({
    document_id: z.string(),
    document_title: z.string(),
    article_no: z.string(),
    pinpoint: nullableString,
    facet: nullableString,
    chunk_id: nullableString,
    article_title: nullableString,
    text: nullableString,
  })
  .transform(
    (raw): RuleSource => ({
      documentId: raw.document_id,
      documentTitle: raw.document_title,
      articleNo: raw.article_no,
      pinpoint: raw.pinpoint,
      facet: raw.facet,
      chunkId: raw.chunk_id,
      articleTitle: raw.article_title,
      text: raw.text,
    }),
  )

const ruleSources = z
  .array(ruleSourceSchema)
  .nullish()
  .transform((value) => value ?? [])

/** `omitempty` on a Go numeric pointer means absent, which is "not
 * established" — deliberately distinct from zero. */
const nullableNumber = z
  .number()
  .nullish()
  .transform((value) => value ?? null)

const nullableBool = z
  .boolean()
  .nullish()
  .transform((value) => value ?? null)

const businessStructureSchema = z
  .object({
    code: z.string(),
    name: z.string(),
    name_suffix: nullableString,
    summary: nullableString,
    liability: nullableString,
    min_members: nullableNumber,
    max_members: nullableNumber,
    min_capital: nullableNumber,
    min_share_par: nullableNumber,
    currency: nullableString,
    allows_public_subscription: nullableBool,
    sources: ruleSources,
  })
  .transform(
    (raw): BusinessStructure => ({
      code: raw.code,
      name: raw.name,
      nameSuffix: raw.name_suffix,
      summary: raw.summary,
      liability: raw.liability,
      minMembers: raw.min_members,
      maxMembers: raw.max_members,
      minCapital: raw.min_capital,
      minSharePar: raw.min_share_par,
      currency: raw.currency,
      allowsPublicSubscription: raw.allows_public_subscription,
      sources: raw.sources,
    }),
  )

const businessActivitySchema = z
  .object({
    code: z.string(),
    name: z.string(),
    regulated: z.boolean().nullish(),
    sources: ruleSources,
  })
  .transform(
    (raw): BusinessActivity => ({
      code: raw.code,
      name: raw.name,
      regulated: raw.regulated ?? false,
      sources: raw.sources,
    }),
  )

const businessRequirementSchema = z
  .object({
    kind: z.enum(['step', 'licence', 'caveat']),
    structure_code: nullableString,
    activity_code: nullableString,
    title: z.string(),
    detail: nullableString,
    authority: nullableString,
    sources: ruleSources,
  })
  .transform(
    (raw): BusinessRequirement => ({
      kind: raw.kind,
      structureCode: raw.structure_code,
      activityCode: raw.activity_code,
      title: raw.title,
      detail: raw.detail,
      authority: raw.authority,
      sources: raw.sources,
    }),
  )

const businessReasonSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    disqualifying: z.boolean().nullish(),
    sources: ruleSources,
  })
  .transform(
    (raw): BusinessReason => ({
      code: raw.code,
      message: raw.message,
      disqualifying: raw.disqualifying ?? false,
      sources: raw.sources,
    }),
  )

const businessCandidateSchema = z
  .object({
    structure: businessStructureSchema,
    eligible: z.boolean().nullish(),
    reasons: z.array(businessReasonSchema).nullish(),
  })
  .transform(
    (raw): BusinessCandidate => ({
      structure: raw.structure,
      eligible: raw.eligible ?? false,
      reasons: raw.reasons ?? [],
    }),
  )

const stringLines = z
  .array(z.string())
  .nullish()
  .transform((value) => value ?? [])

export const businessIntakeFormSchema = z
  .object({
    rule_set_id: z.string(),
    rule_set_label: z.string(),
    activities: z.array(businessActivitySchema).nullish(),
    structures: z.array(businessStructureSchema).nullish(),
    unsupported: stringLines,
  })
  .transform(
    (raw): BusinessIntakeForm => ({
      ruleSetId: raw.rule_set_id,
      ruleSetLabel: raw.rule_set_label,
      activities: raw.activities ?? [],
      structures: raw.structures ?? [],
      unsupported: raw.unsupported,
    }),
  )

export const businessRecommendationSchema = z
  .object({
    rule_set_id: z.string(),
    rule_set_label: z.string(),
    recommended: businessCandidateSchema.nullish(),
    alternatives: z.array(businessCandidateSchema).nullish(),
    excluded: z.array(businessCandidateSchema).nullish(),
    steps: z.array(businessRequirementSchema).nullish(),
    licences: z.array(businessRequirementSchema).nullish(),
    caveats: z.array(businessRequirementSchema).nullish(),
    unsupported: stringLines,
  })
  .transform(
    (raw): BusinessRecommendation => ({
      ruleSetId: raw.rule_set_id,
      ruleSetLabel: raw.rule_set_label,
      recommended: raw.recommended ?? null,
      alternatives: raw.alternatives ?? [],
      excluded: raw.excluded ?? [],
      steps: raw.steps ?? [],
      licences: raw.licences ?? [],
      caveats: raw.caveats ?? [],
      unsupported: raw.unsupported,
    }),
  )
