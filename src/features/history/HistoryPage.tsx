import {
  BadgeCheck,
  History as HistoryIcon,
  MessageSquare,
  MessagesSquare,
  SearchX,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import {
  Badge,
  Button,
  ButtonLink,
  Callout,
  Card,
  EmptyState,
  PageHeader,
} from '@/components/ui'
import {
  clearConversations,
  deleteConversation,
  useConversations,
  type Conversation,
} from '@/features/qa/conversations'
import { conversationPath } from '@/features/qa/url'
import { formatRelativeTime, langAttr, truncate } from '@/lib/utils/format'

/**
 * Saved conversations, most recently used first.
 *
 * Opening one resumes the thread rather than replaying it: the transcript is
 * restored, and the next question continues from it.
 */
export function HistoryPage() {
  const conversations = useConversations()
  const groups = groupByDay(conversations)

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="History"
        description="Every conversation you have had in this browser. Open one to pick up where it left off."
        actions={
          conversations.length > 0 ? (
            <>
              <ButtonLink to="/chat" variant="secondary" size="sm">
                New chat
              </ButtonLink>
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<Trash2 />}
                onClick={() => {
                  if (window.confirm('Delete all conversations? This cannot be undone.')) {
                    clearConversations()
                  }
                }}
              >
                Clear history
              </Button>
            </>
          ) : null
        }
      />

      {conversations.length === 0 ? (
        <EmptyState
          className="rounded-card border border-line bg-surface"
          icon={<HistoryIcon />}
          title="No conversations yet"
          description="Ask something in legal chat and the thread will be saved here, with whether each answer was grounded and how many sources it used."
          action={
            <ButtonLink to="/chat" leadingIcon={<MessageSquare />}>
              Ask a question
            </ButtonLink>
          }
        />
      ) : (
        <>
          {groups.map(([day, dayConversations]) => (
            <section key={day} className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {day}
              </h2>
              <ul className="space-y-2">
                {dayConversations.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                  />
                ))}
              </ul>
            </section>
          ))}

          <Callout tone="info">
            Conversations are stored in this browser only. The API keeps no record
            of what you asked or what it answered, and there are no accounts yet, so
            clearing site data removes them for good.
          </Callout>
        </>
      )}
    </div>
  )
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const last = conversation.turns.at(-1)
  const sources = new Set(
    conversation.turns.flatMap((turn) => turn.citations.map((c) => c.chunkId)),
  ).size

  return (
    <Card as="li" className="flex flex-wrap items-start gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p
          lang={langAttr(conversation.title)}
          className="text-sm font-medium leading-snug text-ink"
        >
          {conversation.title}
        </p>

        {last && conversation.turns.length > 1 ? (
          <p
            lang={langAttr(last.question)}
            className="mt-1 truncate text-xs text-ink-muted"
          >
            Last asked: {truncate(last.question, 120)}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone="neutral" icon={<MessagesSquare />}>
            {conversation.turns.length}{' '}
            {conversation.turns.length === 1 ? 'question' : 'questions'}
          </Badge>
          <Badge tone="neutral">{formatRelativeTime(conversation.updatedAt)}</Badge>
          {last?.abstained ? (
            <Badge tone="warning" icon={<SearchX />}>
              Ended without an answer
            </Badge>
          ) : last?.grounded ? (
            <Badge tone="success" icon={<BadgeCheck />}>
              Grounded
            </Badge>
          ) : (
            <Badge tone="warning" icon={<TriangleAlert />}>
              Partly uncited
            </Badge>
          )}
          {sources > 0 ? (
            <Badge tone="neutral">
              {sources} {sources === 1 ? 'source' : 'sources'}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ButtonLink to={conversationPath(conversation.id)} variant="secondary" size="sm">
          Open
        </ButtonLink>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete conversation: ${conversation.title}`}
          onClick={() => deleteConversation(conversation.id)}
        >
          <Trash2 />
        </Button>
      </div>
    </Card>
  )
}

const dayFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})

/** Groups conversations under a day heading, newest day first. */
function groupByDay(
  conversations: Conversation[],
): Array<[string, Conversation[]]> {
  const groups = new Map<string, Conversation[]>()
  const today = new Date().toDateString()

  for (const conversation of conversations) {
    const date = new Date(conversation.updatedAt)
    const label = date.toDateString() === today ? 'Today' : dayFormatter.format(date)
    const bucket = groups.get(label)
    if (bucket) bucket.push(conversation)
    else groups.set(label, [conversation])
  }

  return [...groups.entries()]
}
