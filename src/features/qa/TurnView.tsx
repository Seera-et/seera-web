import { useState } from 'react'
import {
  BadgeCheck,
  Bookmark,
  Check,
  Copy,
  Layers,
  RotateCcw,
  Search,
  SearchX,
  TriangleAlert,
} from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import {
  Avatar,
  Badge,
  Button,
  Callout,
  Card,
  Chip,
  ErrorState,
  SkeletonText,
} from '@/components/ui'
import type { Suggestion } from '@/lib/api'
import { useAuth } from '@/lib/auth/useAuth'
import { saveAnswerBookmark } from '@/features/bookmarks/store'
import { formatDate, langAttr } from '@/lib/utils/format'
import { AnswerMeta } from './AnswerMeta'
import { AnswerText } from './AnswerText'
import { splitGuidance } from './guidance'
import { SourcesPanel } from './SourcesPanel'
import type { Turn } from './useQaConversation'

/** One question and its answer. */
export function TurnView({
  turn,
  onOpenSource,
  onRetry,
  onAskRelated,
}: {
  turn: Turn
  onOpenSource: (chunkId: string) => void
  onRetry: () => void
  /** Asks one of the follow-ups offered under the answer. */
  onAskRelated: (question: string) => void
}) {
  const retrieving = turn.phase === 'retrieving'
  const streaming = turn.phase === 'streaming'
  const kind = turn.summary?.kind ?? 'legal'
  const abstained = turn.summary?.abstained ?? false

  // A reply to "hello" is not a legal answer, so none of the grounding
  // apparatus applies to it: no badge claiming it is grounded, no warning that
  // it is not, no sources, no timings.
  const conversational = kind === 'conversation'
  // The model read the provisions and reported that they do not settle the
  // question. Not an answer, and not an abstention either — the sources are real
  // and worth reading.
  const insufficient = kind === 'insufficient'
  // An insufficient answer that cited nothing has no sources panel below it, so
  // it cannot point at "the provisions below" — and it must not blame the
  // corpus either. The commonest way to land here is a question the corpus was
  // never going to answer (a finance or economics question routed to retrieval
  // by mistake), where promising an indexing gap promises a capability that
  // will never arrive.
  const insufficientWithNoSources = insufficient && turn.citations.length === 0
  // The model may append a section it states is not drawn from the corpus.
  // Split out so it cannot be read as part of the cited explanation above it.
  const { sourced, guidance } = splitGuidance(turn.answer)
  const truncated = turn.summary?.truncated ?? false
  const ungrounded =
    kind === 'legal' && turn.summary ? !turn.summary.grounded : false
  // Only meaningful for a legal answer that actually reached generation —
  // insufficient/abstention/conversation results never compute it, and
  // showing a confidence note next to their own dedicated explanation would
  // just be noise.
  const confidence = kind === 'legal' ? (turn.summary?.confidence ?? null) : null
  const lowEvidence = confidence !== null && confidence.level !== 'high'

  return (
    <article className="space-y-3">
      <Question turn={turn} />

      <Card className="p-4 sm:p-5">
        <header className="flex items-center gap-2.5">
          <BrandMark className="size-7" />
          <span className="text-sm font-semibold text-ink">Seera</span>

          {retrieving ? (
            <Badge tone="brand">Searching sources…</Badge>
          ) : streaming ? (
            <Badge tone="brand">Answering…</Badge>
          ) : conversational ? null : abstained ? (
            <Badge tone="warning" icon={<SearchX />}>
              No grounded answer
            </Badge>
          ) : insufficient ? (
            <Badge tone="warning" icon={<SearchX />}>
              Not answered by these sources
            </Badge>
          ) : ungrounded ? (
            <Badge tone="warning" icon={<TriangleAlert />}>
              Partly uncited
            </Badge>
          ) : turn.phase === 'done' ? (
            <Badge tone="success" icon={<BadgeCheck />}>
              Grounded
            </Badge>
          ) : turn.phase === 'cancelled' ? (
            <Badge tone="neutral">Stopped</Badge>
          ) : null}
        </header>

        <RouteNote turn={turn} />

        <div className="mt-3">
          {turn.phase === 'error' && turn.error ? (
            <ErrorState error={turn.error} onRetry={onRetry} className="py-6" />
          ) : turn.answer ? (
            <>
              <AnswerText
                text={sourced}
                citations={turn.citations}
                streaming={streaming}
                onOpenSource={onOpenSource}
              />
              {guidance ? <GeneralGuidance text={guidance} /> : null}
            </>
          ) : (
            <SkeletonText lines={4} />
          )}
        </div>

        {ungrounded ? (
          <Callout tone="warning" className="mt-4" title="Not every claim is cited">
            Part of this answer has no citation marker. Treat the uncited parts as
            unverified and check the sources below before relying on them.
          </Callout>
        ) : null}

        {lowEvidence && confidence ? (
          <Callout tone="info" className="mt-4" title="Limited evidence">
            {confidence.level === 'low'
              ? 'Only one weakly-matching source was found for this question. Treat this as a starting point, not the final word — a narrower question or an article number may find something stronger.'
              : 'The sources for this answer agree only loosely — no exact article match, and no agreement between search methods. Worth double-checking the details in the sources below.'}
          </Callout>
        ) : null}

        {insufficientWithNoSources ? (
          <Callout tone="info" className="mt-4" title="Nothing found was relevant enough to cite">
            The corpus was searched and read, and none of it bore on this
            question closely enough to quote — so no sources are shown. Either
            the law on this point is not indexed yet, or this is not a question
            Ethiopian law answers.
          </Callout>
        ) : insufficient ? (
          <Callout tone="info" className="mt-4" title="The corpus did not settle this">
            The provisions below were retrieved and read, and they do not answer
            the question. That is a gap in what has been indexed, not a statement
            that the law is silent.
          </Callout>
        ) : null}

        {truncated ? (
          <Callout tone="warning" className="mt-4" title="This answer was cut off">
            Generation reached its length limit, so the answer stops mid-sentence.
            Ask again, or ask a narrower question — an unfinished legal sentence is
            often missing the condition that changes it.
          </Callout>
        ) : null}

        {turn.phase === 'cancelled' ? (
          <Callout tone="info" className="mt-4">
            You stopped this answer, so it is incomplete.
          </Callout>
        ) : null}

        {conversational ? null : (
          <SourcesPanel
            citations={turn.citations}
            loading={retrieving}
            onOpenSource={onOpenSource}
          />
        )}

        {/* Nothing to copy, save or re-ask about a greeting. */}
        {!conversational && (turn.phase === 'done' || turn.phase === 'cancelled') ? (
          <AnswerToolbar turn={turn} onRetry={onRetry} />
        ) : null}

        {!conversational && turn.summary?.related?.length ? (
          <RelatedQuestions
            suggestions={turn.summary.related}
            onAsk={onAskRelated}
          />
        ) : null}

        {turn.summary && !conversational ? <AnswerMeta summary={turn.summary} /> : null}
      </Card>
    </article>
  )
}

function Question({ turn }: { turn: Turn }) {
  const asOf = formatDate(turn.asOf)

  return (
    <div className="flex items-start justify-end gap-2.5">
      <div className="max-w-[46rem] rounded-card rounded-tr-sm bg-brand-600 px-4 py-3 text-white shadow-lift">
        <p lang={langAttr(turn.question)} className="text-[0.95rem] leading-relaxed">
          {turn.question}
        </p>
        {turn.language || asOf ? (
          <p className="mt-1.5 text-xs text-white/75">
            {[
              turn.language === 'am'
                ? 'Amharic sources only'
                : turn.language === 'en'
                  ? 'English sources only'
                  : null,
              asOf ? `Law as of ${asOf}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        ) : null}
      </div>
      <AskerAvatar />
    </div>
  )
}

function AnswerToolbar({ turn, onRetry }: { turn: Turn; onRetry: () => void }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(turn.answer)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied. Nothing useful to say; the text is selectable.
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void copy()}
        leadingIcon={copied ? <Check /> : <Copy />}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={saved}
        onClick={() => {
          saveAnswerBookmark({
            question: turn.question,
            answer: turn.answer,
            citationCount: turn.citations.length,
            abstained: turn.summary?.abstained ?? false,
          })
          setSaved(true)
        }}
        leadingIcon={<Bookmark />}
      >
        {saved ? 'Saved' : 'Save answer'}
      </Button>
      <Button variant="ghost" size="sm" onClick={onRetry} leadingIcon={<RotateCcw />}>
        Ask again
      </Button>
    </div>
  )
}

/**
 * What the system actually searched for, when that is not what the reader typed.
 *
 * A follow-up is rewritten into a standalone question before retrieval. Hiding
 * that would leave a reader unable to explain why an answer went somewhere
 * unexpected, or to correct it.
 */
function RouteNote({ turn }: { turn: Turn }) {
  const route = turn.route
  if (!route) return null

  const rewritten = route.searchText
  const carried = route.carriedSources

  if (!rewritten && carried === 0) return null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
      {rewritten ? (
        <span className="flex items-center gap-1.5">
          <Search aria-hidden="true" className="size-3.5 shrink-0" />
          Searched for: <span className="text-ink-soft">{rewritten}</span>
        </span>
      ) : null}
      {carried > 0 ? (
        <span className="flex items-center gap-1.5">
          <Layers aria-hidden="true" className="size-3.5 shrink-0" />
          Continuing with {carried} {carried === 1 ? 'source' : 'sources'} from this
          conversation
        </span>
      ) : null}
    </div>
  )
}

/** Follow-ups built from the citations this answer used. */
function RelatedQuestions({
  suggestions,
  onAsk,
}: {
  suggestions: Suggestion[]
  onAsk: (question: string) => void
}) {
  return (
    <section className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Ask next
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <li key={suggestion.question}>
            <Chip onClick={() => onAsk(suggestion.question)}>
              {suggestion.question}
            </Chip>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The section the model states is not drawn from the corpus.
 *
 * Framed rather than hidden. It is prose about Ethiopian law carrying no
 * citations, and rendered in the same type as the sourced explanation above it
 * nothing tells a reader which half is which — which is exactly how an answer
 * ends up trusted for the part that was never grounded. The backend also stops
 * reporting such an answer as grounded when it appears on a question the
 * sources did settle.
 *
 * Deliberately not an AnswerText: no citation markers are parsed here, because
 * by construction there are none to resolve and a marker in this block would be
 * claiming a source it does not have.
 */
function GeneralGuidance({ text }: { text: string }) {
  return (
    <section
      className="mt-4 rounded-card border border-dashed border-line bg-surface-sunken p-4"
      aria-label="General guidance, not verified against the corpus"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
        <TriangleAlert aria-hidden="true" className="size-3.5" />
        Not from the corpus
      </p>
      <p
        className="mt-2 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-soft"
        lang={langAttr(text)}
      >
        {text}
      </p>
      <p className="mt-2 text-xs text-ink-muted">
        General knowledge, not drawn from any indexed Ethiopian legal source and
        not cited. Verify it before relying on it.
      </p>
    </section>
  )
}

/**
 * The avatar beside a question. Chat is behind the auth guard, so there is
 * always a real user here — but it reads the session rather than assuming one,
 * because a session can expire while a transcript is still on screen.
 */
function AskerAvatar() {
  const { user } = useAuth()
  return (
    <Avatar
      name={user?.name ?? 'You'}
      src={user?.avatarUrl}
      size="sm"
      className="mt-0.5"
    />
  )
}
