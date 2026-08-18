import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { History, MessagesSquare, Scale, SquarePen } from 'lucide-react'
import { DISCLAIMER } from '@/app/brand'
import { Badge, Button, ButtonLink, PageHeader } from '@/components/ui'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { ChatEmptyState } from './ChatEmptyState'
import { Composer } from './Composer'
import { newConversationId } from './conversations'
import { SourceDrawer } from './SourceDrawer'
import { StreamAnnouncer } from './StreamAnnouncer'
import { TurnView } from './TurnView'
import { chatSearch, PARAM, readChatQuery, type ChatQuery } from './url'
import { useQaConversation } from './useQaConversation'

/**
 * The Q&A screen.
 *
 * Container: it owns the thread and the URL, and the components below only
 * render what they are handed. The question, its filters, the open source panel
 * and the thread id all live in the URL, so any state of this page can be shared
 * or reloaded — and a reloaded thread comes back with its transcript.
 */
export function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const isDesktop = useIsDesktop()
  const endRef = useRef<HTMLDivElement>(null)

  const query = readChatQuery(searchParams)
  const openSourceId = searchParams.get(PARAM.source)

  // A thread the URL does not name yet still needs an id, so the first answer
  // has somewhere to be stored. "New chat" replaces it.
  const [draftId, setDraftId] = useState(newConversationId)
  const conversationId = searchParams.get(PARAM.conversation) ?? draftId

  const { turns, busy, activeTurnId, ask, cancel, retry } =
    useQaConversation(conversationId)
  // Only a turn asked in this session is announced: a transcript restored from
  // storage should not read itself out on page load.
  const activeTurn = turns.find((turn) => turn.id === activeTurnId)
  const isFollowUp = turns.length > 0

  // The identity of an ask, so arriving with ?q=… asks exactly once.
  const askedKey = useRef<string | null>(null)
  const key = `${conversationId}|${query.question}|${query.language ?? ''}|${query.asOf ?? ''}`

  const setConversationParam = useCallback(
    (id: string, next: ChatQuery | null) => {
      const search = new URLSearchParams(next ? chatSearch(next, id) : '')
      if (!next) search.set(PARAM.conversation, id)
      setSearchParams(search, { replace: true })
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (!query.question || askedKey.current === key) return

    // Reloading a thread whose URL still carries the question must restore the
    // transcript, not ask it a second time. A deliberate re-ask goes through the
    // composer, which does not consult this guard.
    const alreadyAnswered = turns.some(
      (turn) => turn.phase === 'done' && turn.question === query.question,
    )
    if (alreadyAnswered) {
      askedKey.current = key
      return
    }

    askedKey.current = key
    ask(query)
    // Releasing the guard on cleanup matters under StrictMode's mount → unmount
    // → mount: the first attempt is aborted by the unmount, and without this the
    // second pass would skip it and leave the page with no answer.
    return () => {
      askedKey.current = null
    }
    // `query` is derived from the key; re-running on its object identity would
    // re-ask on every unrelated search-param change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Bring a new question into view. Only on a new turn, not on every token —
  // yanking the viewport while someone is reading is worse than a manual scroll.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns.length])

  const submit = useCallback(
    (next: ChatQuery) => {
      askedKey.current = `${conversationId}|${next.question}|${next.language ?? ''}|${next.asOf ?? ''}`
      ask(next)
      // Replace, and keep the thread id: the transcript is the history here, so
      // each question should not add a back-button step that re-asks it.
      setConversationParam(conversationId, next)
    },
    [ask, conversationId, setConversationParam],
  )

  const startNewChat = useCallback(() => {
    const id = newConversationId()
    setDraftId(id)
    askedKey.current = null
    setSearchParams({}, { replace: false })
  }, [setSearchParams])

  const openSource = useCallback(
    (chunkId: string) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous)
        next.set(PARAM.source, chunkId)
        return next
      })
    },
    [setSearchParams],
  )

  const closeSource = useCallback(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.delete(PARAM.source)
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-13rem)] max-w-4xl flex-col">
      <PageHeader
        title="Legal chat"
        description="Grounded answers from indexed Ethiopian legal sources, with the article each claim rests on. Follow-up questions keep the thread."
        eyebrow={
          isFollowUp ? (
            <Badge tone="neutral" icon={<MessagesSquare />}>
              {turns.length} {turns.length === 1 ? 'question' : 'questions'} in this
              thread
            </Badge>
          ) : null
        }
        actions={
          <>
            <ButtonLink to="/history" variant="ghost" size="sm" leadingIcon={<History />}>
              History
            </ButtonLink>
            {turns.length > 0 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={startNewChat}
                leadingIcon={<SquarePen />}
              >
                New chat
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mt-5 flex-1 space-y-6">
        {turns.length === 0 ? (
          <ChatEmptyState onAsk={submit} />
        ) : (
          turns.map((turn) => (
            <TurnView
              key={turn.id}
              turn={turn}
              onOpenSource={openSource}
              onRetry={retry}
            />
          ))
        )}
        <div ref={endRef} />
      </div>

      <StreamAnnouncer turn={activeTurn} />

      <div className="sticky bottom-0 mt-6 space-y-2 bg-canvas pb-2 pt-3">
        <Composer
          busy={busy}
          followUp={isFollowUp}
          defaults={{ language: query.language, asOf: query.asOf }}
          onSubmit={submit}
          onCancel={cancel}
        />
        <p className="flex items-start gap-1.5 px-1 text-xs leading-relaxed text-ink-muted">
          <Scale aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          {DISCLAIMER}
        </p>
      </div>

      <SourceDrawer
        chunkId={openSourceId}
        onClose={closeSource}
        asSheet={!isDesktop}
      />
    </div>
  )
}
