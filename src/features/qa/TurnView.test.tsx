import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  expand: 0,
  carriedSources: 0,
  rerank: 10,
  firstToken: 500,
  total: 1200,
  candidates: 20,
  contextChunks: 4,
}

function summary(overrides: Partial<AnswerSummary> = {}): AnswerSummary {
  return {
    kind: 'legal' as AnswerKind,
    truncated: false,
    intent: 'legal',
    depth: 'explain',
    related: [],
    citations: [],
    abstained: false,
    grounded: true,
    timings: TIMINGS,
    model: 'gemini-3.5-flash',
    reranker: 'passthrough',
    requestId: 'req-1',
    confidence: null,
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
    route: null,
    phase: 'done',
    error: null,
    askedAt: Date.now(),
    ...overrides,
  }
}

function render(t: Turn) {
  return renderWithProviders(
    <TurnView
      turn={t}
      onOpenSource={vi.fn()}
      onRetry={vi.fn()}
      onAskRelated={vi.fn()}
    />,
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

describe('TurnView confidence note', () => {
  it('says nothing when confidence is high', () => {
    render(
      turn({
        summary: summary({
          confidence: { level: 'high', exactMatch: true, sourceCount: 3 },
        }),
      }),
    )

    expect(screen.queryByText('Limited evidence')).not.toBeInTheDocument()
  })

  it('says nothing when the backend never computed confidence at all', () => {
    render(turn({ summary: summary({ confidence: null }) }))

    expect(screen.queryByText('Limited evidence')).not.toBeInTheDocument()
  })

  it('flags medium confidence without claiming the answer is wrong', () => {
    render(
      turn({
        summary: summary({
          confidence: { level: 'medium', exactMatch: false, sourceCount: 2 },
        }),
      }),
    )

    expect(screen.getByText('Limited evidence')).toBeInTheDocument()
    expect(screen.getByText(/agree only loosely/)).toBeInTheDocument()
  })

  it('flags low confidence with a narrower-question suggestion', () => {
    render(
      turn({
        summary: summary({
          confidence: { level: 'low', exactMatch: false, sourceCount: 1 },
        }),
      }),
    )

    expect(screen.getByText('Limited evidence')).toBeInTheDocument()
    expect(screen.getByText(/starting point, not the final word/)).toBeInTheDocument()
  })

  // Confidence is only computed for a completed legal answer — showing it
  // next to insufficient/abstention's own dedicated explanation, or on a
  // conversational reply that made no claim at all, would just be noise.
  it('is suppressed on non-legal outcomes even if confidence is somehow present', () => {
    render(
      turn({
        summary: summary({
          kind: 'insufficient',
          grounded: false,
          confidence: { level: 'low', exactMatch: false, sourceCount: 1 },
        }),
      }),
    )

    expect(screen.queryByText('Limited evidence')).not.toBeInTheDocument()
  })
})

/**
 * Transparency about what the system did with the question.
 *
 * A follow-up is rewritten before retrieval and may carry provisions from
 * earlier in the thread. Both change which law the answer came from, so both are
 * shown.
 */
describe('TurnView routing note', () => {
  const route = {
    intent: 'discussion',
    depth: 'explain' as const,
    searchText: 'What does Article 265 of the Commercial Code require?',
    carriedSources: 2,
  }

  it('shows the question that was actually searched for', () => {
    render(turn({ question: 'explain the second one', route }))

    expect(screen.getByText(/Searched for:/)).toBeInTheDocument()
    expect(
      screen.getByText('What does Article 265 of the Commercial Code require?'),
    ).toBeInTheDocument()
  })

  it('says how many sources were carried from the conversation', () => {
    render(turn({ route }))
    expect(screen.getByText(/Continuing with 2 sources/)).toBeInTheDocument()
  })

  it('stays quiet when the question was searched for as typed', () => {
    render(
      turn({
        route: { intent: 'legal', depth: null, searchText: null, carriedSources: 0 },
      }),
    )
    expect(screen.queryByText(/Searched for:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Continuing with/)).not.toBeInTheDocument()
  })
})

describe('TurnView follow-up suggestions', () => {
  it('offers the follow-ups the answer came with', async () => {
    const onAskRelated = vi.fn()
    const t = turn({
      summary: summary({
        related: [{ question: 'Explain Article 265 in plain language' }],
      }),
    })

    renderWithProviders(
      <TurnView
        turn={t}
        onOpenSource={vi.fn()}
        onRetry={vi.fn()}
        onAskRelated={onAskRelated}
      />,
    )

    const chip = screen.getByRole('button', {
      name: 'Explain Article 265 in plain language',
    })
    await userEvent.click(chip)
    expect(onAskRelated).toHaveBeenCalledWith('Explain Article 265 in plain language')
  })

  it('offers none on a conversational reply', () => {
    render(
      turn({
        summary: summary({
          kind: 'conversation',
          related: [{ question: 'should not be offered' }],
        }),
      }),
    )
    expect(screen.queryByText('Ask next')).not.toBeInTheDocument()
  })
})

/**
 * The three ways an answer can be less than it looks, each with its own
 * presentation. The sample that prompted these was badged "Grounded" while
 * saying the sources did not contain the answer, and stopped mid-sentence.
 */
describe('TurnView honesty about what an answer is', () => {
  it('does not badge an unanswered question as grounded', () => {
    render(
      turn({
        answer: 'The sources do not contain the requirements for a business licence.',
        summary: summary({ kind: 'insufficient', grounded: true }),
      }),
    )

    expect(screen.queryByText('Grounded')).not.toBeInTheDocument()
    expect(screen.getByText('Not answered by these sources')).toBeInTheDocument()
    // Nothing was cited, so there is no sources panel to point at, and no
    // grounds for blaming the index — see the test below.
    expect(screen.getByText(/none of it bore on this question/)).toBeInTheDocument()
    expect(screen.queryByText(/provisions below/)).not.toBeInTheDocument()
  })

  /**
   * A live sample, 2026-09-03: "what is ROI in Ethiopian agriculture?" was
   * routed to the corpus, read seven provisions, cited none — and was shown
   * under "The provisions below were retrieved and read", with no provisions
   * below, promising that the answer would arrive once the corpus grew. ROI is
   * not Ethiopian law and was never going to be indexed.
   */
  it('does not blame the index when an unanswered question cited nothing', () => {
    render(
      turn({
        citations: [],
        answer: 'The provided sources do not contain any information about ROI.',
        summary: summary({ kind: 'insufficient', grounded: true }),
      }),
    )

    expect(screen.queryByText(/gap in what has been indexed/)).not.toBeInTheDocument()
    expect(screen.getByText(/not a question Ethiopian law answers/)).toBeInTheDocument()
  })

  it('still shows the provisions that were read', () => {
    render(
      turn({
        citations: [
          {
            marker: 'S1',
            chunkId: 'chunk-1',
            articleId: 'a1',
            versionId: 'v1',
            documentId: 'd1',
            documentTitle: 'Commercial Code',
            issuingAuthority: null,
            articleNo: '22',
            articleTitle: null,
            sectionPath: [],
            language: 'en',
            effectiveFrom: null,
            text: 'Particular persons may be restricted from acting as traders.',
            structureConfidence: 'high',
          },
        ],
        summary: summary({ kind: 'insufficient' }),
      }),
    )

    expect(screen.getByText(/Sources \(1\)/)).toBeInTheDocument()
    // Provisions were cited and are on screen, so this genuinely is a corpus
    // gap and the callout may say so.
    expect(screen.getByText(/gap in what has been indexed/)).toBeInTheDocument()
  })

  it('says when an answer was cut off rather than showing it as finished', () => {
    render(
      turn({
        answer: 'Registration is required when applying for principal registration',
        summary: summary({ truncated: true }),
      }),
    )

    expect(screen.getByText('This answer was cut off')).toBeInTheDocument()
  })

  it('stays quiet about truncation on a complete answer', () => {
    render(turn({ summary: summary({ truncated: false }) }))
    expect(screen.queryByText('This answer was cut off')).not.toBeInTheDocument()
  })
})

/**
 * Rule 12 of the answer prompt lets the model add a section it states is not
 * drawn from the corpus. Rendered in the same type as the cited explanation
 * above it, nothing told a reader which half carried sources.
 */
describe('TurnView separates unsourced guidance from cited answer', () => {
  const withGuidance =
    'Capital must be fully paid [S1].\n\n' +
    'General guidance (not verified against the corpus):\n' +
    'Typically this exists to protect creditors. Verify it.'

  it('frames the guidance section and labels it as not from the corpus', () => {
    render(turn({ answer: withGuidance, summary: summary({ kind: 'legal' }) }))

    expect(screen.getByText('Not from the corpus')).toBeInTheDocument()
    expect(
      screen.getByText(/Typically this exists to protect creditors/),
    ).toBeInTheDocument()
    // The heading is the frame's label, not body text repeated inside it.
    expect(
      screen.queryByText(/General guidance \(not verified/),
    ).not.toBeInTheDocument()
  })

  it('leaves an answer with no guidance section untouched', () => {
    render(
      turn({
        answer: 'Capital must be fully paid [S1].',
        summary: summary({ kind: 'legal' }),
      }),
    )

    expect(screen.queryByText('Not from the corpus')).not.toBeInTheDocument()
  })
})
