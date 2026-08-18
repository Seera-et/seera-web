import { useSearchParams } from 'react-router-dom'
import { Bookmark as BookmarkIcon, MessageSquare, Trash2 } from 'lucide-react'
import {
  Button,
  ButtonLink,
  Callout,
  EmptyState,
  PageHeader,
  Tabs,
  type Tab,
} from '@/components/ui'
import { BookmarkCard } from './BookmarkCard'
import { clearBookmarks, useBookmarks } from './store'

type Filter = 'all' | 'citation' | 'answer'

const FILTER_PARAM = 'type'

/**
 * Saved sources and answers.
 *
 * Stored in this browser, which the page says outright — an account-backed
 * bookmark needs an auth and persistence API that does not exist yet, and a user
 * should know before they rely on it.
 */
export function BookmarksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const bookmarks = useBookmarks()

  const raw = searchParams.get(FILTER_PARAM)
  const filter: Filter = raw === 'citation' || raw === 'answer' ? raw : 'all'

  const citations = bookmarks.filter((item) => item.kind === 'citation')
  const answers = bookmarks.filter((item) => item.kind === 'answer')
  const visible =
    filter === 'all' ? bookmarks : bookmarks.filter((item) => item.kind === filter)

  const tabs: readonly Tab<Filter>[] = [
    { value: 'all', label: 'All', count: bookmarks.length },
    { value: 'citation', label: 'Sources', count: citations.length },
    { value: 'answer', label: 'Answers', count: answers.length },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Bookmarks"
        description="Sources and answers you saved for later."
        actions={
          bookmarks.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Trash2 />}
              onClick={() => {
                if (window.confirm('Remove all bookmarks? This cannot be undone.')) {
                  clearBookmarks()
                }
              }}
            >
              Clear all
            </Button>
          ) : null
        }
      />

      {bookmarks.length === 0 ? (
        <EmptyState
          className="rounded-card border border-line bg-surface"
          icon={<BookmarkIcon />}
          title="Nothing saved yet"
          description="Save a source from any answer's source card, or save a whole answer from its toolbar. Both appear here."
          action={
            <ButtonLink to="/chat" leadingIcon={<MessageSquare />}>
              Ask a question
            </ButtonLink>
          }
        />
      ) : (
        <>
          <Tabs
            label="Bookmark type"
            value={filter}
            tabs={tabs}
            onChange={(next) =>
              setSearchParams(
                next === 'all' ? {} : { [FILTER_PARAM]: next },
                { replace: true },
              )
            }
          />

          <ul className="space-y-3">
            {visible.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} />
            ))}
          </ul>

          <Callout tone="info">
            Bookmarks are kept in this browser only. Clearing site data removes them,
            and they do not follow you to another device.
          </Callout>
        </>
      )}
    </div>
  )
}
