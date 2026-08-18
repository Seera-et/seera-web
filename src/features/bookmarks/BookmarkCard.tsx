import { ExternalLink, MessageSquare, Trash2 } from 'lucide-react'
import { Badge, Button, ButtonLink, Card, CardTitle } from '@/components/ui'
import { documentPath } from '@/features/explorer/url'
import { chatPath } from '@/features/qa/url'
import { formatDate, formatRelativeTime, truncate } from '@/lib/utils/format'
import { removeBookmark, type Bookmark } from './store'

export function BookmarkCard({ bookmark }: { bookmark: Bookmark }) {
  return (
    <Card as="li" className="p-4">
      {bookmark.kind === 'citation' ? (
        <CitationBookmarkBody bookmark={bookmark} />
      ) : (
        <AnswerBookmarkBody bookmark={bookmark} />
      )}
    </Card>
  )
}

function CitationBookmarkBody({
  bookmark,
}: {
  bookmark: Extract<Bookmark, { kind: 'citation' }>
}) {
  const isAmharic = bookmark.language === 'am'
  const effective = formatDate(bookmark.effectiveFrom)

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-sm leading-snug">{bookmark.documentTitle}</CardTitle>
          <p className="mt-0.5 text-xs text-ink-soft">
            {bookmark.articleNo ? `Article ${bookmark.articleNo}` : 'Unnumbered section'}
            {bookmark.articleTitle ? ` — ${bookmark.articleTitle}` : ''}
          </p>
        </div>
        <RemoveButton id={bookmark.id} label="Remove this source" />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone="neutral">Source</Badge>
        <Badge tone="neutral">{isAmharic ? 'አማርኛ' : 'English'}</Badge>
        {effective ? <Badge tone="neutral">In force from {effective}</Badge> : null}
        <Badge tone="neutral">Saved {formatRelativeTime(bookmark.savedAt)}</Badge>
      </div>

      <p
        lang={isAmharic ? 'am' : undefined}
        className="mt-2.5 text-xs leading-relaxed text-ink-soft"
      >
        {truncate(bookmark.snippet, 240)}
      </p>

      <ButtonLink
        to={documentPath({
          documentId: bookmark.documentId,
          versionId: bookmark.versionId,
          articleNo: bookmark.articleNo,
          chunkId: bookmark.id,
        })}
        variant="secondary"
        size="sm"
        className="mt-3"
        leadingIcon={<ExternalLink />}
      >
        Open source
      </ButtonLink>
    </>
  )
}

function AnswerBookmarkBody({
  bookmark,
}: {
  bookmark: Extract<Bookmark, { kind: 'answer' }>
}) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <CardTitle className="text-sm leading-snug">{bookmark.question}</CardTitle>
        <RemoveButton id={bookmark.id} label="Remove this answer" />
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge tone="neutral">Answer</Badge>
        {bookmark.abstained ? (
          <Badge tone="warning">No grounded answer</Badge>
        ) : (
          <Badge tone="neutral">
            {bookmark.citationCount}{' '}
            {bookmark.citationCount === 1 ? 'source' : 'sources'}
          </Badge>
        )}
        <Badge tone="neutral">Saved {formatRelativeTime(bookmark.savedAt)}</Badge>
      </div>

      <p className="mt-2.5 whitespace-pre-line text-xs leading-relaxed text-ink-soft">
        {truncate(bookmark.answer, 320)}
      </p>

      <ButtonLink
        to={chatPath({ question: bookmark.question })}
        variant="secondary"
        size="sm"
        className="mt-3"
        leadingIcon={<MessageSquare />}
      >
        Ask again
      </ButtonLink>
    </>
  )
}

function RemoveButton({ id, label }: { id: string; label: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      onClick={() => removeBookmark(id)}
    >
      <Trash2 />
    </Button>
  )
}
