import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import type { AnswerKind, AnswerSummary } from '@/lib/api'
import { TurnView } from './TurnView'
import type { Turn } from './useQaConversation'

/**
 * How the three kinds of reply are presented.
 *
 * The rule underneath every case here: the grounding apparatus — the "Grounded"
 * badge, the sources panel, the uncited warning — belongs to answers that make
 * legal claims. Attaching it to a greeting would be a claim about the law that
 * nothing supports.
 */

const TIMINGS = {
  condense: 0,
  retrieval: 100,
  rerank: 10,
  firstToken: 500,
  total: 1200,
  candidates: 20,
  contextChunks: 4,
}

function summary(overrides: Partial<AnswerSummary> = {}): AnswerSummary {
  return {
    kind: 'legal' as AnswerKind,
    citations: [],
    abstained: false,
    grounded: true,
    timings: TIMINGS,
    model: 'gemini-3.5-flash',
    reranker: 'passthrough',
    requestId: 'req-1',
    ...overrides,
  }
}

function turn(overrides: Partial<Turn> = {}): Turn {
  return {
    id: 'turn-1',
    question: 'Hello',
    answer: 'Hello. I answer questions about Ethiopian law.',
    citations: [],
    summary: summary(),
    phase: 'done',
    error: null,
    askedAt: Date.now(),
    ...overrides,
  }
}

function render(t: Turn) {
  return renderWithProviders(
    <TurnView turn={t} onOpenSource={vi.fn()} onRetry={vi.fn()} />,
  )
}

describe('TurnView', () => {
  it('shows a conversational reply with no grounding claim of any kind', () => {
    render(
      turn({
        summary: summary({ kind: 'conversation', grounded: false, abstained: false }),
      }),
    )

    expect(
      screen.getByText(/I answer questions about Ethiopian law/),
    ).toBeInTheDocument()

    // grounded=false on a greeting means "not a legal claim", not "uncited".
    expect(screen.queryByText('Grounded')).not.toBeInTheDocument()
    expect(screen.queryByText('Partly uncited')).not.toBeInTheDocument()
    expect(screen.queryByText(/Not every claim is cited/)).not.toBeInTheDocument()
    // Nothing to cite, nothing to measure, nothing to save.
    expect(screen.queryByText(/Sources \(/)).not.toBeInTheDocument()
    expect(screen.queryByText('Answer details')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save answer/i })).not.toBeInTheDocument()
  })

  it('marks a grounded legal answer as grounded', () => {
    render(turn({ question: 'How do I register a company?', summary: summary() }))

    expect(screen.getByText('Grounded')).toBeInTheDocument()
    expect(screen.getByText('Answer details')).toBeInTheDocument()
  })

  it('warns when a legal answer left claims uncited', () => {
    render(turn({ summary: summary({ grounded: false }) }))

    expect(screen.getByText('Partly uncited')).toBeInTheDocument()
    expect(screen.getByText(/Not every claim is cited/)).toBeInTheDocument()
  })

  it('presents an abstention as a result, not a failure', () => {
    render(
      turn({
        answer: 'I could not find anything in the indexed Ethiopian legal sources.',
        summary: summary({ kind: 'abstention', abstained: true, grounded: true }),
      }),
    )

    expect(screen.getByText('No grounded answer')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText('Partly uncited')).not.toBeInTheDocument()
  })
})
