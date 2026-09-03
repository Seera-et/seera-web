import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ApiError,
  isAbortError,
  streamAnswer,
  type AnswerCitation,
  type AnswerSummary,
  type RouteInfo,
} from '@/lib/api'
import {
  appendTurn,
  carriedChunkIds,
  historyFor,
  useConversation,
  type Conversation,
  type StoredTurn,
} from './conversations'
import type { ChatQuery } from './url'

/**
 * Where a turn is in its lifecycle. Every terminal phase clears the busy flag —
 * the UI must never be left permanently "thinking".
 */
export type TurnPhase =
  /** Request sent, retrieval running. No text yet. */
  | 'retrieving'
  /** Tokens are arriving. */
  | 'streaming'
  | 'done'
  | 'error'
  | 'cancelled'

export type Turn = {
  id: string
  question: string
  language?: ChatQuery['language']
  asOf?: string
  /** Accumulated answer text, including the model's `[S1]` markers. */
  answer: string
  /** From the `sources` event, then replaced by the `done` event's list. */
  citations: AnswerCitation[]
  summary: AnswerSummary | null
  /** What the router decided, available before the first token. */
  route: RouteInfo | null
  phase: TurnPhase
  error: ApiError | null
  askedAt: number
}

export type ConversationState = {
  /** Stored turns followed by anything still in flight or failed. */
  turns: Turn[]
  busy: boolean
  /**
   * The turn asked in this session, if any. Lets the caller announce progress
   * for a live answer without announcing a transcript restored from storage.
   */
  activeTurnId: string | null
  ask: (query: ChatQuery) => void
  cancel: () => void
  /** Re-runs the most recent question. */
  retry: () => void
}

/**
 * Drives one conversation thread.
 *
 * Two sources of truth, split on purpose. Finished turns live in the
 * conversation store, so they survive a reload and appear in History. Turns that
 * are streaming, cancelled or failed live here, in memory — a half-answer is not
 * worth persisting, and a failed one should not become part of the record.
 *
 * Each question carries the thread's earlier turns, which is what makes "what
 * about for a PLC?" work: the server rewrites it into a standalone question
 * before retrieval and never stores any of it.
 */
/** Stable identity for "no in-memory turns", so hook deps do not churn. */
const NO_TURNS: Turn[] = []

export function useQaConversation(conversationId: string): ConversationState {
  const stored = useConversation(conversationId)
  const [busy, setBusy] = useState(false)
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  // The in-memory tail is tagged with the thread it belongs to, and read back as
  // empty for any other thread. Switching threads therefore drops it during
  // render, with no effect and no flash of the previous thread's turns.
  const [localState, setLocalState] = useState<{
    conversationId: string
    turns: Turn[]
  }>({ conversationId, turns: NO_TURNS })

  const local =
    localState.conversationId === conversationId ? localState.turns : NO_TURNS

  const setLocal = useCallback(
    (update: (previous: Turn[]) => Turn[]) => {
      setLocalState((previous) => ({
        conversationId,
        turns: update(
          previous.conversationId === conversationId ? previous.turns : NO_TURNS,
        ),
      }))
    },
    [conversationId],
  )

  // Leaving the page must not leave a stream running and paying for tokens.
  useEffect(() => () => controllerRef.current?.abort(), [])

  const patch = useCallback((id: string, apply: (turn: Turn) => Turn) => {
    setLocal((previous) =>
      previous.map((turn) => (turn.id === id ? apply(turn) : turn)),
    )
  }, [setLocal])

  const run = useCallback(
    async (query: ChatQuery, history: Conversation | undefined) => {
      const question = query.question.trim()
      if (!question) return

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      const turn: Turn = {
        id: crypto.randomUUID(),
        question,
        language: query.language,
        asOf: query.asOf,
        answer: '',
        citations: [],
        summary: null,
        route: null,
        phase: 'retrieving',
        error: null,
        askedAt: Date.now(),
      }
      setLocal((previous) => [...previous, turn])
      setActiveTurnId(turn.id)
      setBusy(true)

      // The answer is accumulated here as well as in state.
      //
      // Not a duplicate for convenience: persisting the finished turn is a side
      // effect, and a side effect must not live inside a setState updater. React
      // may call an updater more than once — StrictMode always does — and doing
      // the store write in there wrote every turn twice, which is what put each
      // exchange on the page two times.
      let answer = ''

      try {
        const summary = await streamAnswer(
          {
            question,
            language: query.language,
            asOf: query.asOf,
            history: historyFor(history),
            // Chunk ids only. The server re-reads the text, so a follow-up can
            // be about a provision on screen without the client supplying it.
            contextChunks: carriedChunkIds(history),
          },
          {
            onRoute: (route) => patch(turn.id, (current) => ({ ...current, route })),
            onSources: (citations) =>
              patch(turn.id, (current) => ({ ...current, citations })),
            onToken: (text) => {
              answer += text
              patch(turn.id, (current) => ({
                ...current,
                phase: 'streaming',
                answer: current.answer + text,
              }))
            },
          },
          controller.signal,
        )

        const completed: StoredTurn = {
          id: turn.id,
          question: turn.question,
          language: turn.language,
          asOf: turn.asOf,
          answer,
          // The `done` list is authoritative and is taken verbatim, even when it
          // is empty. Falling back to what retrieval returned would dress an
          // answer that cited nothing in a full set of sources — exactly the
          // implied grounding this product must not show.
          citations: summary.citations,
          kind: summary.kind,
          truncated: summary.truncated,
          related: summary.related,
          abstained: summary.abstained,
          grounded: summary.grounded,
          confidence: summary.confidence,
          askedAt: turn.askedAt,
          model: summary.model,
          reranker: summary.reranker,
          timings: summary.timings,
          requestId: summary.requestId,
        }

        appendTurn(conversationId, completed)
        // Handed over to the store; keeping it here too would show it twice.
        setLocal((previous) => previous.filter((item) => item.id !== turn.id))
      } catch (error) {
        if (isAbortError(error)) {
          // Cancelled before any text arrived: nothing to show, so the empty
          // card goes away rather than sitting there saying "Stopped".
          setLocal((previous) => {
            const current = previous.find((item) => item.id === turn.id)
            if (current && current.answer === '') {
              return previous.filter((item) => item.id !== turn.id)
            }
            return previous.map((item) =>
              item.id === turn.id ? { ...item, phase: 'cancelled' } : item,
            )
          })
        } else {
          const apiError =
            error instanceof ApiError
              ? error
              : new ApiError({
                  kind: 'network',
                  code: 'unknown_error',
                  message: 'The answer could not be completed.',
                  cause: error,
                })
          patch(turn.id, (current) => ({
            ...current,
            phase: 'error',
            error: apiError,
          }))
        }
      } finally {
        // The one place the busy flag clears, for every terminal path.
        if (controllerRef.current === controller) {
          controllerRef.current = null
          setBusy(false)
        }
      }
    },
    [conversationId, patch, setLocal],
  )

  const ask = useCallback(
    (query: ChatQuery) => {
      void run(query, stored)
    },
    [run, stored],
  )

  const cancel = useCallback(() => controllerRef.current?.abort(), [])

  const turns: Turn[] = [...(stored?.turns ?? []).map(fromStored), ...local]

  const retry = useCallback(() => {
    // The most recent turn is the last in-memory one if there is any — those are
    // the failed and cancelled ones — otherwise the last stored turn.
    const lastLocal = local.at(-1)
    const lastStored = stored?.turns.at(-1)
    const last = lastLocal ?? lastStored
    if (!last) return

    // Ask again as if that turn had not happened: sending it back as history
    // would show the model its own previous attempt at the same question.
    const priorTurns =
      !lastLocal && stored && lastStored
        ? { ...stored, turns: stored.turns.slice(0, -1) }
        : stored

    void run(
      { question: last.question, language: last.language, asOf: last.asOf },
      priorTurns,
    )
  }, [local, run, stored])

  return { turns, busy, activeTurnId, ask, cancel, retry }
}

/** A stored turn, presented like a finished live one. */
function fromStored(turn: StoredTurn): Turn {
  return {
    id: turn.id,
    question: turn.question,
    language: turn.language,
    asOf: turn.asOf,
    answer: turn.answer,
    citations: turn.citations,
    route: null,
    summary: {
      kind: turn.kind ?? 'legal',
      truncated: turn.truncated ?? false,
      intent: null,
      depth: null,
      related: turn.related ?? [],
      citations: turn.citations,
      abstained: turn.abstained,
      grounded: turn.grounded,
      timings: turn.timings,
      model: turn.model,
      reranker: turn.reranker,
      requestId: turn.requestId,
      confidence: turn.confidence ?? null,
    },
    phase: 'done',
    error: null,
    askedAt: turn.askedAt,
  }
}
