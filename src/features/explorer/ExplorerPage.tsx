import { useSearchParams } from 'react-router-dom'
import { Library, MessageSquare, Search, SearchX } from 'lucide-react'
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  SegmentedControl,
  Select,
  Skeleton,
} from '@/components/ui'
import { LanguagePicker } from '@/features/qa/LanguagePicker'
import { fromLanguage, toLanguage, type LanguageChoice } from '@/features/qa/language'
import { isLanguage } from '@/features/qa/url'
import { useCorpusSearch, useCorpusStats, useDocuments } from '@/lib/api/queries'
import type { CorpusSearch, DocumentSummary, SearchMode } from '@/lib/api'
import { formatNumber } from '@/lib/utils/format'
import { DocumentCard } from './DocumentCard'
import { SearchHitCard } from './SearchHitCard'
import { DOC_TYPE_OPTIONS, isDocType } from './labels'
import { EXPLORER_PARAM, isScope, type ExplorerScope } from './url'

/** Matches the API's default page size for the catalogue. */
const PAGE_SIZE = 24

/** The search endpoint caps a page at 50; 20 is its default and reads well. */
const SEARCH_PAGE_SIZE = 20

const SCOPES = [
  { value: 'documents', label: 'Documents' },
  { value: 'provisions', label: 'Provisions' },
] as const satisfies readonly { value: ExplorerScope; label: string }[]

/**
 * The catalogue, not the text search.
 *
 * Browsing works with no query at all, so it is something to land on; a
 * provision search with an empty box can only be a prompt. Defaulting the other
 * way would make the Explorer's front door an empty state.
 */
const DEFAULT_SCOPE: ExplorerScope = 'documents'

const MODES = [
  { value: 'hybrid', label: 'Both' },
  { value: 'keyword', label: 'Wording' },
  { value: 'semantic', label: 'Meaning' },
] as const satisfies readonly { value: SearchMode; label: string }[]

function isMode(value: string | null): value is SearchMode {
  return value === 'hybrid' || value === 'keyword' || value === 'semantic'
}

/**
 * Browse and search the corpus.
 *
 * Two scopes, one search box. "Documents" answers *which laws exist* — a
 * filtered catalogue. "Provisions" answers *which articles are about this* — a
 * ranked search inside their text. They are deliberately separate because they
 * are different questions: a reader looking for "the Commercial Code" and a
 * reader looking for "capital requirements" want differently shaped answers,
 * and collapsing them into one list serves neither well.
 *
 * All state lives in the URL, so a filtered view is shareable and survives a
 * reload, and the query key is derived from it — which is also what makes the
 * cache correct.
 */
export function ExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const term = searchParams.get(EXPLORER_PARAM.query) ?? ''
  const rawLanguage = searchParams.get(EXPLORER_PARAM.language)
  const language = isLanguage(rawLanguage) ? rawLanguage : undefined
  const rawType = searchParams.get(EXPLORER_PARAM.type)
  const docType = isDocType(rawType) ? rawType : undefined
  const domain = searchParams.get(EXPLORER_PARAM.domain) ?? undefined
  const rawYear = Number.parseInt(searchParams.get(EXPLORER_PARAM.year) ?? '', 10)
  const year = Number.isFinite(rawYear) ? rawYear : undefined
  const page = Number.parseInt(searchParams.get(EXPLORER_PARAM.page) ?? '1', 10) || 1

  const rawScope = searchParams.get(EXPLORER_PARAM.scope)
  const scope: ExplorerScope = isScope(rawScope) ? rawScope : DEFAULT_SCOPE
  const rawMode = searchParams.get(EXPLORER_PARAM.mode)
  const mode: SearchMode = isMode(rawMode) ? rawMode : 'hybrid'

  // The category list comes from what was actually ingested, so the filter can
  // never offer a domain the corpus has nothing in.
  const statsQuery = useCorpusStats()
  const domains = statsQuery.data?.domains ?? []

  const searching = scope === 'provisions' && term.trim() !== ''

  const documentsQuery = useDocuments(
    {
      term: term || undefined,
      language,
      docType,
      domain,
      year,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    },
    // The catalogue is not fetched while a provision search is on screen.
    scope === 'documents',
  )

  const searchQuery = useCorpusSearch(
    {
      term,
      mode,
      language,
      docType,
      domain,
      year,
      limit: SEARCH_PAGE_SIZE,
      offset: (page - 1) * SEARCH_PAGE_SIZE,
    },
    searching,
  )

  function setParam(name: string, value: string) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(name, value)
        else next.delete(name)
        // Any change other than the page itself invalidates the page number.
        if (name !== EXPLORER_PARAM.page) next.delete(EXPLORER_PARAM.page)
        return next
      },
      { replace: true },
    )
  }

  const filtered = Boolean(term || language || docType || domain || year)

  const active = scope === 'documents' ? documentsQuery : searchQuery
  const pageSize = scope === 'documents' ? PAGE_SIZE : SEARCH_PAGE_SIZE
  const total =
    scope === 'documents' ? (documentsQuery.data?.total ?? 0) : (searchQuery.data?.total ?? 0)
  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Legal explorer"
        description="Every document indexed for answering, and the provisions inside it. Only published versions appear here — what you can browse is what an answer can cite."
        actions={
          statsQuery.data ? (
            <Badge tone="neutral" icon={<Library />}>
              {formatNumber(statsQuery.data.documents)}{' '}
              {statsQuery.data.documents === 1 ? 'document' : 'documents'} ·{' '}
              {formatNumber(statsQuery.data.articles)} articles
            </Badge>
          ) : null
        }
      />

      <div className="space-y-3 rounded-card border border-line bg-surface p-4 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            label="Search for"
            value={scope}
            segments={SCOPES}
            size="sm"
            onChange={(next) => setParam(EXPLORER_PARAM.scope, next)}
          />
          {scope === 'provisions' ? (
            <SegmentedControl
              label="Match by"
              value={mode}
              segments={MODES}
              size="sm"
              onChange={(next) => setParam(EXPLORER_PARAM.mode, next)}
            />
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Input
            label={scope === 'documents' ? 'Search documents' : 'Search provisions'}
            placeholder={
              scope === 'documents'
                ? 'Title or issuing authority…'
                : 'A phrase, a question, or "Article 45"…'
            }
            defaultValue={term}
            leadingIcon={<Search />}
            onChange={(event) => setParam(EXPLORER_PARAM.query, event.target.value)}
          />
          <Select
            label="Document type"
            options={DOC_TYPE_OPTIONS}
            value={docType ?? ''}
            onChange={(event) => setParam(EXPLORER_PARAM.type, event.target.value)}
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Language</span>
            <LanguagePicker
              size="md"
              value={fromLanguage(language)}
              onChange={(choice: LanguageChoice) =>
                setParam(EXPLORER_PARAM.language, toLanguage(choice) ?? '')
              }
            />
          </div>
        </div>

        {domains.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium text-ink-muted">Domain</span>
            {domains.map((stat) => (
              <Chip
                key={stat.domain}
                selected={domain === stat.domain}
                onClick={() =>
                  setParam(
                    EXPLORER_PARAM.domain,
                    domain === stat.domain ? '' : stat.domain,
                  )
                }
              >
                {stat.domain}
                <span className="ml-1 text-ink-muted">{formatNumber(stat.documents)}</span>
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      {scope === 'provisions' && !searching ? (
        <Card>
          <EmptyState
            icon={<Search />}
            title="Search the text of the law"
            description='Type a phrase, a plain-language question, or an article number. "Wording" finds the terms you typed; "Meaning" finds provisions about what you asked even when they use different words.'
          />
        </Card>
      ) : active.isError ? (
        <Card>
          <ErrorState error={active.error} onRetry={() => void active.refetch()} />
        </Card>
      ) : active.isPending ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-44 w-full rounded-card" />
            </li>
          ))}
        </ul>
      ) : scope === 'documents' ? (
        <DocumentResults
          documents={documentsQuery.data?.documents ?? []}
          stale={documentsQuery.isPlaceholderData}
          filtered={filtered}
          onClear={() => setSearchParams({}, { replace: true })}
        />
      ) : (
        <ProvisionResults
          search={searchQuery.data}
          stale={searchQuery.isPlaceholderData}
          onClear={() => setSearchParams({}, { replace: true })}
        />
      )}

      {lastPage > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setParam(EXPLORER_PARAM.page, String(page - 1))}
          >
            Previous
          </Button>
          <p className="text-xs text-ink-muted">
            Page {page} of {lastPage}
          </p>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= lastPage}
            onClick={() => setParam(EXPLORER_PARAM.page, String(page + 1))}
          >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  )
}

function DocumentResults({
  documents,
  stale,
  filtered,
  onClear,
}: {
  documents: DocumentSummary[]
  stale: boolean
  filtered: boolean
  onClear: () => void
}) {
  if (documents.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={filtered ? <SearchX /> : <Library />}
          title={filtered ? 'Nothing matches those filters' : 'The corpus is empty'}
          description={
            filtered
              ? 'No published document matches. Try a broader filter, search the provisions instead of the titles, or ask the question directly.'
              : 'No document has been published yet. Ingest one with the admin endpoint, and it will appear here and become answerable at the same moment.'
          }
          action={
            filtered ? (
              <>
                <Button variant="secondary" onClick={onClear}>
                  Clear filters
                </Button>
                <ButtonLink to="/chat" leadingIcon={<MessageSquare />}>
                  Ask in chat
                </ButtonLink>
              </>
            ) : null
          }
        />
      </Card>
    )
  }

  return (
    <ul
      className={
        // Dimmed while a filter change is in flight, so the list is visibly
        // stale rather than silently wrong.
        stale
          ? 'grid gap-3 opacity-60 transition-opacity sm:grid-cols-2 xl:grid-cols-3'
          : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
      }
    >
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </ul>
  )
}

function ProvisionResults({
  search,
  stale,
  onClear,
}: {
  search: CorpusSearch | undefined
  stale: boolean
  onClear: () => void
}) {
  if (!search) return null

  if (search.hits.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<SearchX />}
          title="No provision matches"
          description={
            search.mode === 'keyword'
              ? 'Nothing in the corpus uses those words. Try "Meaning" instead — it finds provisions about a question even when they are worded differently.'
              : 'Nothing in the indexed corpus is about that. The corpus is small; the law you are looking for may simply not be ingested yet.'
          }
          action={
            <>
              <Button variant="secondary" onClick={onClear}>
                Clear filters
              </Button>
              <ButtonLink to="/chat" leadingIcon={<MessageSquare />}>
                Ask in chat
              </ButtonLink>
            </>
          }
        />
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
        <p>
          {/* "capped" means an arm filled its quota, so the number is a floor.
              Saying "240" when it is really "at least 240" would be a claim
              about the corpus that is not true. */}
          {search.capped ? 'More than ' : ''}
          {formatNumber(search.total)}{' '}
          {search.total === 1 ? 'provision' : 'provisions'} ranked
        </p>
        {search.articleRefs.length > 0 ? (
          <p>
            Article {search.articleRefs.join(', ')} looked up directly and placed
            first.
          </p>
        ) : null}
      </div>

      {/* The requested mode is not always the one that ran. A reader comparing
          "Wording" with "Meaning" needs to know when the semantic arm was never
          available, rather than concluding the two are the same. */}
      {search.mode === 'keyword' ? (
        <Callout tone="info" title="Matching on wording only">
          No embedding provider is configured on this deployment, so provisions
          are matched by the words they use. A question phrased in your own words
          may find nothing.
        </Callout>
      ) : null}

      <ul className={stale ? 'space-y-3 opacity-60 transition-opacity' : 'space-y-3'}>
        {search.hits.map((hit) => (
          <SearchHitCard key={hit.articleId} hit={hit} />
        ))}
      </ul>
    </div>
  )
}
