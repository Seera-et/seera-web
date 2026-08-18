import { useState } from 'react'
import {
  BadgeCheck,
  Bookmark,
  Check,
  Copy,
  RotateCcw,
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
  ErrorState,
  SkeletonText,
} from '@/components/ui'
import { PLACEHOLDER_USER } from '@/app/session'
import { saveAnswerBookmark } from '@/features/bookmarks/store'
import { formatDate, langAttr } from '@/lib/utils/format'
import { AnswerMeta } from './AnswerMeta'
import { AnswerText } from './AnswerText'
import { SourcesPanel } from './SourcesPanel'
import type { Turn } from './useQaConversation'

/** One question and its answer. */
export function TurnView({
  turn,
  onOpenSource,
  onRetry,
}: {
  turn: Turn
  onOpenSource: (chunkId: string) => void
  onRetry: () => void
}) {
  const retrieving = turn.phase === 'retrieving'
  const streaming = turn.phase === 'streaming'
  const kind = turn.summary?.kind ?? 'legal'
  const abstained = turn.summary?.abstained ?? false

  // A reply to "hello" is not a legal answer, so none of the grounding
  // apparatus applies to it: no badge claiming it is grounded, no warning that
  // it is not, no sources, no timings.
  const conversational = kind === 'conversation'
  const ungrounded =
    kind === 'legal' && turn.summary ? !turn.summary.grounded : false

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

        <div className="mt-3">
          {turn.phase === 'error' && turn.error ? (
            <ErrorState error={turn.error} onRetry={onRetry} className="py-6" />
          ) : turn.answer ? (
            <AnswerText
              text={turn.answer}
              citations={turn.citations}
              streaming={streaming}
              onOpenSource={onOpenSource}
            />
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
      <Avatar name={PLACEHOLDER_USER.name} size="sm" className="mt-0.5" />
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
