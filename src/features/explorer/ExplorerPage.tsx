import { useSearchParams } from 'react-router-dom'
import { Library, MessageSquare, Search, SearchX } from 'lucide-react'
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Skeleton,
} from '@/components/ui'
import { LanguagePicker } from '@/features/qa/LanguagePicker'
import { fromLanguage, toLanguage, type LanguageChoice } from '@/features/qa/language'
import { isLanguage } from '@/features/qa/url'
import { useDocuments } from '@/lib/api/queries'
import { formatNumber } from '@/lib/utils/format'
import { DocumentCard } from './DocumentCard'
import { DOC_TYPE_OPTIONS, isDocType } from './labels'
import { EXPLORER_PARAM } from './url'

/** Matches the API's default page size. */
const PAGE_SIZE = 24

/**
 * Browse the corpus.
 *
 * Filters live in the URL, so a filtered view is shareable and survives a
 * reload, and the query key is derived from them — which is also what makes the
 * cache correct.
 */
export function ExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const term = searchParams.get(EXPLORER_PARAM.query) ?? ''
  const rawLanguage = searchParams.get(EXPLORER_PARAM.language)
  const language = isLanguage(rawLanguage) ? rawLanguage : undefined
  const rawType = searchParams.get(EXPLORER_PARAM.type)
  const docType = isDocType(rawType) ? rawType : undefined
  const page = Number.parseInt(searchParams.get(EXPLORER_PARAM.page) ?? '1', 10) || 1

  const query = {
    term: term || undefined,
    language,
    docType,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }

  const { data, isPending, isError, error, refetch, isPlaceholderData } =
    useDocuments(query)

  function setParam(name: string, value: string) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(name, value)
        else next.delete(name)
        // Any filter change invalidates the page number.
        if (name !== EXPLORER_PARAM.page) next.delete(EXPLORER_PARAM.page)
        return next
      },
      { replace: true },
    )
  }

  const documents = data?.documents ?? []
  const total = data?.total ?? 0
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filtered = Boolean(term || language || docType)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Legal explorer"
        description="Every document indexed for answering, and the articles inside it. Only published versions appear here — what you can browse is what an answer can cite."
        actions={
          data ? (
            <Badge tone="neutral" icon={<Library />}>
              {formatNumber(total)} {total === 1 ? 'document' : 'documents'}
            </Badge>
          ) : null
        }
      />

      <div className="grid gap-3 rounded-card border border-line bg-surface p-4 shadow-soft sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Input
          label="Search documents"
          placeholder="Title or issuing authority…"
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

      {isError ? (
        <Card>
          <ErrorState error={error} onRetry={() => void refetch()} />
        </Card>
      ) : isPending ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <Skeleton className="h-44 w-full rounded-card" />
            </li>
          ))}
        </ul>
      ) : documents.length === 0 ? (
        <Card>
          <EmptyState
            icon={filtered ? <SearchX /> : <Library />}
            title={filtered ? 'Nothing matches those filters' : 'The corpus is empty'}
            description={
              filtered
                ? 'No published document matches. Try a broader type or language, or ask the question directly instead of looking for the document.'
                : 'No document has been published yet. Ingest one with the admin endpoint, and it will appear here and become answerable at the same moment.'
            }
            action={
              filtered ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setSearchParams({}, { replace: true })}
                  >
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
      ) : (
        <>
          <ul
            className={
              // Dimmed while a filter change is in flight, so the list is
              // visibly stale rather than silently wrong.
              isPlaceholderData
                ? 'grid gap-3 opacity-60 transition-opacity sm:grid-cols-2 xl:grid-cols-3'
                : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
            }
          >
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </ul>

          {lastPage > 1 ? (
            <nav
              aria-label="Pagination"
              className="flex items-center justify-between gap-3"
            >
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
        </>
      )}
    </div>
  )
}
