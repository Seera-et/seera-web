import { Bookmark, BookmarkCheck, MessageSquare, TriangleAlert } from 'lucide-react'
import { Badge, Button, ButtonLink, Card } from '@/components/ui'
import {
  isBookmarked,
  toggleSourceBookmark,
  useBookmarks,
} from '@/features/bookmarks/store'
import { chatPath } from '@/features/qa/url'
import type { ArticleRecord, DocumentSummary, DocumentVersion } from '@/lib/api'
import { cn } from '@/lib/utils/cn'

/**
 * One provision, as read in the document viewer.
 *
 * `highlighted` marks the article an answer cited, which is what a citation link
 * lands on.
 */
export function ArticleView({
  article,
  document,
  version,
  highlighted = false,
}: {
  article: ArticleRecord
  document: DocumentSummary
  version: DocumentVersion
  highlighted?: boolean
}) {
  const bookmarks = useBookmarks()
  const saved = article.chunkId ? isBookmarked(bookmarks, article.chunkId) : false
  const isAmharic = document.language === 'am'

  return (
    <Card
      as="li"
      id={`article-${article.articleNo}`}
      className={cn(
        'scroll-mt-24 p-5',
        highlighted && 'border-brand-400 ring-1 ring-brand-400/40',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink" lang={isAmharic ? 'am' : undefined}>
            {article.articleNo ? `Article ${article.articleNo}` : 'Provision'}
            {article.articleNoRaw && article.articleNoRaw !== article.articleNo
              ? ` (${article.articleNoRaw})`
              : ''}
            {article.title ? ` — ${article.title}` : ''}
          </h3>
          {article.sectionPath.length > 0 ? (
            <p className="mt-0.5 text-xs text-ink-muted">
              {article.sectionPath.join(' › ')}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          {highlighted ? <Badge tone="brand">Cited</Badge> : null}
          {article.structureConfidence === 'low' ? (
            <Badge tone="warning" icon={<TriangleAlert />}>
              Approximate boundary
            </Badge>
          ) : null}
        </div>
      </div>

      <p
        lang={isAmharic ? 'am' : undefined}
        className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft"
      >
        {article.text}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1">
        <ButtonLink
          to={chatPath({
            question: `What does Article ${article.articleNo} of ${document.title} say?`,
            language: document.language === 'am' ? 'am' : undefined,
          })}
          variant="ghost"
          size="sm"
          leadingIcon={<MessageSquare />}
        >
          Ask about this
        </ButtonLink>

        {article.chunkId ? (
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={saved}
            leadingIcon={saved ? <BookmarkCheck /> : <Bookmark />}
            onClick={() =>
              toggleSourceBookmark({
                chunkId: article.chunkId as string,
                documentId: document.id,
                versionId: version.id,
                documentTitle: document.title,
                articleNo: article.articleNo,
                articleTitle: article.title,
                sectionPath: article.sectionPath,
                language: document.language,
                effectiveFrom: version.effectiveFrom,
                text: article.text,
              })
            }
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
        ) : (
          // An article with no chunk was never indexed, so it cannot be cited or
          // retrieved. Saying so beats a button that quietly does nothing.
          <span className="px-2 text-xs text-ink-muted">Not indexed for retrieval</span>
        )}

        {article.pageNo > 0 ? (
          <span className="ml-auto text-xs text-ink-muted">Page {article.pageNo}</span>
        ) : null}
      </div>
    </Card>
  )
}
