import { beforeEach, describe, expect, it } from 'vitest'
import type { AnswerTimings } from '@/lib/api'
import {
  appendTurn,
  clearConversations,
  historyFor,
  type Conversation,
  type StoredTurn,
} from './conversations'

const TIMINGS: AnswerTimings = {
  condense: 0,
  retrieval: 0,
  rerank: 0,
  firstToken: 0,
  total: 0,
  candidates: 0,
  contextChunks: 0,
}

function turn(overrides: Partial<StoredTurn> = {}): StoredTurn {
  return {
    id: crypto.randomUUID(),
    question: 'How do I register a company?',
    answer: 'You register it [S1].',
    citations: [],
    abstained: false,
    grounded: true,
    askedAt: 1_755_000_000_000,
    model: 'gemini-3.5-flash',
    reranker: 'passthrough',
    timings: TIMINGS,
    requestId: null,
    ...overrides,
  }
}

describe('conversation store', () => {
  beforeEach(clearConversations)

  it('appends turns in order under one thread', () => {
    appendTurn('t1', turn({ question: 'First?' }))
    appendTurn('t1', turn({ question: 'Second?' }))

    const stored = read('t1')
    expect(stored?.turns.map((item) => item.question)).toEqual(['First?', 'Second?'])
    expect(stored?.title).toBe('First?')
  })

  it('is idempotent on the turn id', () => {
    // The bug this guards: one exchange stored twice, shown twice.
    const only = turn()
    appendTurn('t2', only)
    appendTurn('t2', only)

    expect(read('t2')?.turns).toHaveLength(1)
  })

  it('replaces a turn appended again with new content', () => {
    const first = turn({ answer: 'Draft.' })
    appendTurn('t3', first)
    appendTurn('t3', { ...first, answer: 'Final.' })

    expect(read('t3')?.turns).toHaveLength(1)
    expect(read('t3')?.turns[0].answer).toBe('Final.')
  })

  it('trims a stored citation but keeps its identifiers', () => {
    const long = 'ሀ'.repeat(2000)
    appendTurn(
      't4',
      turn({
        citations: [
          {
            marker: 'S1',
            chunkId: 'chunk-1',
            articleId: 'article-1',
            versionId: 'version-1',
            documentId: 'document-1',
            documentTitle: 'Commercial Code',
            issuingAuthority: null,
            articleNo: '627',
            articleTitle: null,
            sectionPath: [],
            language: 'am',
            effectiveFrom: null,
            text: long,
            structureConfidence: 'high',
          },
        ],
      }),
    )

    const [citation] = read('t4')!.turns[0].citations
    expect(citation.text.length).toBeLessThan(long.length)
    // The identifiers are what let the full text be re-resolved from the API.
    expect(citation.chunkId).toBe('chunk-1')
    expect(citation.versionId).toBe('version-1')
  })
})

describe('historyFor', () => {
  it('sends both sides of each exchange, oldest first', () => {
    const conversation: Conversation = {
      id: 't5',
      title: 'First?',
      createdAt: 0,
      updatedAt: 0,
      turns: [
        turn({ question: 'First?', answer: 'First answer.' }),
        turn({ question: 'Second?', answer: 'Second answer.' }),
      ],
    }

    expect(historyFor(conversation)).toEqual([
      { role: 'user', text: 'First?' },
      { role: 'assistant', text: 'First answer.' },
      { role: 'user', text: 'Second?' },
      { role: 'assistant', text: 'Second answer.' },
    ])
  })

  it('is empty for a thread that has no turns yet', () => {
    expect(historyFor(undefined)).toEqual([])
  })

  it('caps how far back it reaches', () => {
    const turns = Array.from({ length: 20 }, (_, i) =>
      turn({ question: `Q${i}`, answer: `A${i}` }),
    )
    const conversation: Conversation = {
      id: 't6',
      title: 'Q0',
      createdAt: 0,
      updatedAt: 0,
      turns,
    }

    const history = historyFor(conversation)
    expect(history.length).toBeLessThanOrEqual(12)
    // The most recent exchange is the one a follow-up depends on.
    expect(history.at(-1)).toEqual({ role: 'assistant', text: 'A19' })
  })
})

function read(id: string): Conversation | undefined {
  const raw = window.localStorage.getItem('seera.conversations.v1')
  const conversations = JSON.parse(raw ?? '[]') as Conversation[]
  return conversations.find((conversation) => conversation.id === id)
}
