import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, FileText, Landmark, MessageSquare } from 'lucide-react'
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  Skeleton,
  SkeletonText,
} from '@/components/ui'
import { useArticles, useCitation, useDocument } from '@/lib/api/queries'
import { formatDate, formatNumber } from '@/lib/utils/format'
import type { DocumentVersion } from '@/lib/api'
import { ArticleView } from './ArticleView'
import { DOC_TYPE_LABELS } from './labels'
import { DOC_PARAM, documentPath } from './url'

/**
 * The document viewer: `/documents/:id?version=&article=&chunk=`.
 *
 * Deep-linkable by construction, because that is how a citation opens it. The
 * version is stated at the top and switchable — a reader must never be unsure
 * which version they are reading.
 */
export function DocumentPage() {
  const { documentId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const versionParam = searchParams.get(DOC_PARAM.version)
  const articleNo = searchParams.get(DOC_PARAM.article)
  const chunkId = searchParams.get(DOC_PARAM.chunk)

  // A search hit deep-links with a cursor so the provision is on the first page
  // fetched. Without it a link to Article 500 of an 823-article code opens at
  // Article 1 and the reader has to page there by hand.
  const rawFrom = Number.parseInt(searchParams.get(DOC_PARAM.from) ?? '', 10)
  const from = Number.isFinite(rawFrom) && rawFrom > 0 ? rawFrom : 0

  const documentQuery = useDocument(documentId)
  const articlesQuery = useArticles(documentId, versionParam, from)
  // Resolved separately so a citation link shows its exact source immediately,
  // without waiting for the page of articles that happens to contain it.
  const citedQuery = useCitation(chunkId)

  const detail = documentQuery.data
  const pages = articlesQuery.data?.pages ?? []
  const version = pages[0]?.version
  const articles = pages.flatMap((page) => page.articles)
  const cited = citedQuery.data

  const highlightArticleNo = articleNo ?? cited?.articleNo ?? null

  // Bring the cited provision into view once it is on the page.
  const scrolledTo = useRef<string | null>(null)
  useEffect(() => {
    if (!highlightArticleNo || scrolledTo.current === highlightArticleNo) return
    const target = document.getElementById(`article-${highlightArticleNo}`)
    if (!target) return
    scrolledTo.current = highlightArticleNo
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [highlightArticleNo, articles.length])

  if (documentQuery.isError) {
    return (
      <Shell>
        <Card>
          <ErrorState
            error={documentQuery.error}
            onRetry={() => void documentQuery.refetch()}
          />
        </Card>
      </Shell>
    )
  }

  if (documentQuery.isPending || !detail) {
    return (
      <Shell>
        <Skeleton className="h-24 w-full rounded-card" />
        <Card className="p-5">
          <SkeletonText lines={10} />
        </Card>
      </Shell>
    )
  }

  const { document: doc, versions } = detail
  const shown = version ?? doc.version
  const isAmharic = doc.language === 'am'
  const effective = formatDate(shown.effectiveFrom)
  const repealed = formatDate(shown.repealedAt)

  return (
    <Shell>
      <PageHeader
        eyebrow={
          <Badge tone="neutral" icon={<Landmark />}>
            {doc.issuingAuthority || DOC_TYPE_LABELS[doc.docType]}
          </Badge>
        }
        title={doc.title}
        description={
          articleNo
            ? `Opened at Article ${articleNo}.`
            : `${DOC_TYPE_LABELS[doc.docType]} · ${formatNumber(shown.articleCount)} articles`
        }
        actions={
          <ButtonLink
            to={`/chat?q=${encodeURIComponent(`In ${doc.title}, `)}`}
            variant="secondary"
            leadingIcon={<MessageSquare />}
          >
            Ask about this document
          </ButtonLink>
        }
      />

      {/* Version provenance stays at the top. */}
      <Card className="flex flex-wrap items-center gap-3 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={shown.status === 'published' ? 'brand' : 'warning'}>
            {shown.label || 'Unlabelled version'}
            {shown.status === 'superseded' ? ' · superseded' : ''}
          </Badge>
          <Badge tone="neutral">{isAmharic ? 'አማርኛ' : 'English'}</Badge>
          {effective ? <Badge tone="neutral">In force from {effective}</Badge> : null}
          {repealed ? <Badge tone="warning">Repealed {repealed}</Badge> : null}
        </div>

        {versions.length > 1 ? (
          <Select
            label="Version"
            hideLabel
            wrapperClassName="ml-auto w-56"
            value={shown.id}
            options={versions.map((candidate) => ({
              value: candidate.id,
              label: versionLabel(candidate),
            }))}
            onChange={(event) =>
              setSearchParams(
                (previous) => {
                  const next = new URLSearchParams(previous)
                  next.set(DOC_PARAM.version, event.target.value)
                  return next
                },
                { replace: true },
              )
            }
          />
        ) : null}

        {doc.sourceUrl ? (
          <a
            href={doc.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            <ExternalLink className="size-3.5" />
            Official publication
          </a>
        ) : null}
      </Card>

      {shown.status === 'superseded' ? (
        <Callout tone="warning" title="This is not the current version">
          You are reading a superseded version. Switch to the published one unless
          you specifically need the law as it stood.
        </Callout>
      ) : null}

      {/* The reader arrived mid-document from a search result or citation. Say
          so, and offer the way back to the top — otherwise the list silently
          starts at an arbitrary article and looks like a document with its
          opening missing. */}
      {from > 0 ? (
        <Callout tone="info" title="Opened partway into this document">
          Showing from {articleNo ? `Article ${articleNo}` : 'the linked provision'}{' '}
          onwards.{' '}
          <Link
            to={documentPath({
              documentId,
              versionId: versionParam ?? undefined,
            })}
            className="font-medium underline"
          >
            Read from the beginning
          </Link>
          .
        </Callout>
      ) : null}

      {cited ? (
        <Card className="border-brand-200 p-5 dark:border-brand-900">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
            The provision this citation points at
          </p>
          <h2 className="mt-1 text-sm font-semibold text-ink">
            {cited.articleNo ? `Article ${cited.articleNo}` : 'Cited provision'}
            {cited.articleTitle ? ` — ${cited.articleTitle}` : ''}
          </h2>
          <div className="mt-3 border-l-2 border-brand-400 bg-surface-accent/60 p-4">
            <p
              lang={cited.language === 'am' ? 'am' : undefined}
              className="whitespace-pre-line text-sm leading-relaxed text-ink"
            >
              {cited.text}
            </p>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Characters {cited.charStart}–{cited.charEnd}
            {cited.pageNo > 0 ? ` · page ${cited.pageNo}` : ''} · chunk{' '}
            <code className="font-mono">{cited.chunkId}</code>
          </p>
        </Card>
      ) : null}

      <section aria-label="Articles" className="space-y-3">
        {articlesQuery.isError ? (
          <Card>
            <ErrorState
              error={articlesQuery.error}
              onRetry={() => void articlesQuery.refetch()}
            />
          </Card>
        ) : articlesQuery.isPending ? (
          <Card className="p-5">
            <SkeletonText lines={12} />
          </Card>
        ) : articles.length === 0 ? (
          <Card>
            <EmptyState
              icon={<FileText />}
              title="This version has no parsed articles"
              description="The document was published without article-level structure, so there is nothing to page through. Retrieval has nothing to cite from it either."
            />
          </Card>
        ) : (
          <>
            <ul className="space-y-3">
              {articles.map((article) => (
                <ArticleView
                  key={article.id}
                  article={article}
                  document={doc}
                  version={shown}
                  highlighted={
                    highlightArticleNo !== null &&
                    article.articleNo === highlightArticleNo
                  }
                />
              ))}
            </ul>

            <div className="flex flex-col items-center gap-2 py-2">
              <p className="text-xs text-ink-muted">
                Showing {formatNumber(articles.length)} of{' '}
                {formatNumber(shown.articleCount)} articles
              </p>
              {articlesQuery.hasNextPage ? (
                <Button
                  variant="secondary"
                  loading={articlesQuery.isFetchingNextPage}
                  onClick={() => void articlesQuery.fetchNextPage()}
                >
                  Load more articles
                </Button>
              ) : null}
            </div>
          </>
        )}
      </section>
    </Shell>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        to="/explorer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to explorer
      </Link>
      {children}
    </div>
  )
}

function versionLabel(version: DocumentVersion): string {
  const effective = formatDate(version.effectiveFrom)
  const status = version.status === 'published' ? 'current' : version.status
  return `${version.label || 'Unlabelled'} · ${status}${effective ? ` · from ${effective}` : ''}`
}
