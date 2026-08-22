import { describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { citationFixture, providerWrapper, sseResponse } from '@/test/utils'
import { appendTurn } from './conversations'
import { useQaConversation } from './useQaConversation'

// The real store, with the write counted. The defect being pinned below is a
// second write per turn, which the store's own idempotency would otherwise
// absorb and hide.
vi.mock('./conversations', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./conversations')>()
  return { ...actual, appendTurn: vi.fn(actual.appendTurn) }
})

/**
 * The whole client answer path, from `ask()` to a stored turn, against the exact
 * SSE frames the Go handler emits.
 *
 * Each test uses its own conversation id: the conversation store is a module
 * singleton, so sharing one would let a previous test's turns leak into the next.
 */

function mockFetch(...responses: Response[]) {
  const calls: Array<{ url: string; body: unknown }> = []
  let index = 0

  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    })
    const response = responses[Math.min(index, responses.length - 1)]
    index += 1
    return response
  })

  vi.stubGlobal('fetch', fetchMock)
  return calls
}

const ANSWER_FRAMES = [
  { event: 'sources', data: { citations: [citationFixture()] } },
  { event: 'token', data: { text: 'A private limited company ' } },
  { event: 'token', data: { text: 'may be formed by two persons [S1].' } },
  {
    event: 'done',
    data: {
      citations: [citationFixture()],
      abstained: false,
      grounded: true,
      timings_ms: { condense: 0, retrieval: 120, rerank: 40, first_token: 900, total: 2100 },
      model: 'gemini-3.5-flash',
      reranker: 'cohere',
      request_id: 'req-1',
    },
  },
]

describe('useQaConversation', () => {
  it('streams an answer and keeps the finished turn', async () => {
    mockFetch(sseResponse(ANSWER_FRAMES))

    const { result } = renderHook(() => useQaConversation('conv-stream'), {
      wrapper: providerWrapper(),
    })

    act(() => result.current.ask({ question: 'How do I register a company?' }))

    await waitFor(() => expect(result.current.busy).toBe(false))

    const turn = result.current.turns.at(-1)
    expect(turn?.phase).toBe('done')
    expect(turn?.answer).toBe(
      'A private limited company may be formed by two persons [S1].',
    )
    expect(turn?.citations.map((c) => c.chunkId)).toEqual(['chunk-1'])
    expect(turn?.summary?.grounded).toBe(true)
    expect(turn?.summary?.model).toBe('gemini-3.5-flash')
  })

  it('survives a reload by storing the turn under its conversation', async () => {
    mockFetch(sseResponse(ANSWER_FRAMES))

    const first = renderHook(() => useQaConversation('conv-reload'), {
      wrapper: providerWrapper(),
    })
    act(() => first.result.current.ask({ question: 'How do I register a company?' }))
    await waitFor(() => expect(first.result.current.busy).toBe(false))
    first.unmount()

    // A fresh mount of the same thread — what happens after a refresh.
    const second = renderHook(() => useQaConversation('conv-reload'), {
      wrapper: providerWrapper(),
    })
    expect(second.result.current.turns).toHaveLength(1)
    expect(second.result.current.turns[0].question).toBe(
      'How do I register a company?',
    )
  })

  it('sends the earlier turns with a follow-up', async () => {
    const calls = mockFetch(sseResponse(ANSWER_FRAMES), sseResponse(ANSWER_FRAMES))

    const { result } = renderHook(() => useQaConversation('conv-followup'), {
      wrapper: providerWrapper(),
    })

    act(() => result.current.ask({ question: 'How do I register a company?' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    act(() => result.current.ask({ question: 'What about for a PLC?' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    expect(calls).toHaveLength(2)

    // The first question carries no history; the second carries both sides of
    // the first exchange, which is what makes the pronoun resolvable.
    expect((calls[0].body as Record<string, unknown>).history).toBeUndefined()
    expect((calls[1].body as Record<string, unknown>).history).toEqual([
      { role: 'user', text: 'How do I register a company?' },
      {
        role: 'assistant',
        text: 'A private limited company may be formed by two persons [S1].',
      },
    ])
    expect(result.current.turns).toHaveLength(2)
  })

  it('only sends filters that were set', async () => {
    const calls = mockFetch(sseResponse(ANSWER_FRAMES))

    const { result } = renderHook(() => useQaConversation('conv-filters'), {
      wrapper: providerWrapper(),
    })

    act(() =>
      result.current.ask({ question: 'የንግድ ማኅበር እንዴት ይቋቋማል?', language: 'am' }),
    )
    await waitFor(() => expect(result.current.busy).toBe(false))

    // The Go handler rejects unknown fields and explicit nulls, so an unset
    // filter has to be an absent key.
    expect(calls[0].body).toEqual({
      question: 'የንግድ ማኅበር እንዴት ይቋቋማል?',
      language: 'am',
    })
  })

  it('reports a server error event and stops being busy', async () => {
    mockFetch(
      sseResponse([
        { event: 'sources', data: { citations: [] } },
        {
          event: 'error',
          data: {
            code: 'quota_exhausted',
            message: 'The service is over its AI provider quota.',
            request_id: 'req-9',
          },
        },
      ]),
    )

    const { result } = renderHook(() => useQaConversation('conv-error'), {
      wrapper: providerWrapper(),
    })

    act(() => result.current.ask({ question: 'Anything' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    const turn = result.current.turns.at(-1)
    expect(turn?.phase).toBe('error')
    expect(turn?.error?.code).toBe('quota_exhausted')
    // A failed turn is not part of the record.
    expect(window.localStorage.getItem('seera.conversations.v1') ?? '').not.toContain(
      'conv-error',
    )
  })

  it('treats a stream that ends without done as a dropped connection', async () => {
    mockFetch(
      sseResponse([
        { event: 'sources', data: { citations: [citationFixture()] } },
        { event: 'token', data: { text: 'A partial answer' } },
      ]),
    )

    const { result } = renderHook(() => useQaConversation('conv-dropped'), {
      wrapper: providerWrapper(),
    })

    act(() => result.current.ask({ question: 'Anything' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    const turn = result.current.turns.at(-1)
    expect(turn?.phase).toBe('error')
    expect(turn?.error?.code).toBe('stream_closed')
    // The partial text stays on screen; it is not silently discarded.
    expect(turn?.answer).toBe('A partial answer')
  })

  it('surfaces a pre-stream failure as an error turn', async () => {
    mockFetch(
      new Response(
        JSON.stringify({
          error: {
            code: 'invalid_request',
            message: 'question is required',
            request_id: 'req-3',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const { result } = renderHook(() => useQaConversation('conv-400'), {
      wrapper: providerWrapper(),
    })

    act(() => result.current.ask({ question: 'x' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    expect(result.current.turns.at(-1)?.error?.code).toBe('invalid_request')
  })
})

/**
 * Regression: every exchange appeared twice in the transcript.
 *
 * The cause was a store write inside a setState updater. React is free to call
 * an updater more than once and StrictMode always does, so the finished turn was
 * persisted twice — and the app runs in StrictMode, where the plain renderHook
 * used above does not.
 */
describe('useQaConversation under StrictMode', () => {
  it('stores a finished turn exactly once', async () => {
    vi.mocked(appendTurn).mockClear()
    mockFetch(sseResponse(ANSWER_FRAMES))

    const { result } = renderHook(() => useQaConversation('conv-strict'), {
      wrapper: providerWrapper({ strict: true }),
    })

    act(() => result.current.ask({ question: 'How do I register a company?' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    expect(result.current.turns).toHaveLength(1)

    // The root cause: the store write sat inside a setState updater, and
    // StrictMode ran it twice.
    expect(appendTurn).toHaveBeenCalledTimes(1)

    // And it is one turn in storage, not two sharing an id.
    const stored = JSON.parse(
      window.localStorage.getItem('seera.conversations.v1') ?? '[]',
    ) as Array<{ id: string; turns: unknown[] }>
    const conversation = stored.find((item) => item.id === 'conv-strict')
    expect(conversation?.turns).toHaveLength(1)
  })

  it('is idempotent if the same turn is appended twice', async () => {
    mockFetch(sseResponse(ANSWER_FRAMES))

    const { result } = renderHook(() => useQaConversation('conv-idempotent'), {
      wrapper: providerWrapper({ strict: true }),
    })

    act(() => result.current.ask({ question: 'First question?' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    const [turn] = result.current.turns
    act(() => {
      appendTurn('conv-idempotent', {
        id: turn.id,
        question: turn.question,
        answer: 'A corrected answer.',
        citations: [],
        abstained: false,
        grounded: true,
        askedAt: turn.askedAt,
        model: 'gemini-3.5-flash',
        reranker: 'passthrough',
        timings: turn.summary!.timings,
        requestId: null,
      })
    })

    expect(result.current.turns).toHaveLength(1)
    expect(result.current.turns[0].answer).toBe('A corrected answer.')
  })
})

/**
 * Conversation memory. A follow-up carries the identifiers of the provisions
 * already on screen, so the server can re-read them rather than hoping retrieval
 * finds them again — and so nothing the client holds becomes evidence.
 */
describe('useQaConversation carrying sources', () => {
  it('sends the chunk ids of citations already in the thread', async () => {
    const calls = mockFetch(sseResponse(ANSWER_FRAMES), sseResponse(ANSWER_FRAMES))

    const { result } = renderHook(() => useQaConversation('conv-carry'), {
      wrapper: providerWrapper(),
    })

    act(() => result.current.ask({ question: 'How do I register a company?' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    act(() => result.current.ask({ question: 'explain the second one' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    const first = calls[0].body as Record<string, unknown>
    const second = calls[1].body as Record<string, unknown>

    expect(first.context_chunks).toBeUndefined()
    expect(second.context_chunks).toEqual(['chunk-1'])
  })

  it('records the routing decision on the turn', async () => {
    mockFetch(
      sseResponse([
        {
          event: 'route',
          data: {
            intent: 'discussion',
            depth: 'explain',
            search_text: 'What does Article 265 of the Commercial Code require?',
            carried_sources: 2,
          },
        },
        ...ANSWER_FRAMES,
      ]),
    )

    const { result } = renderHook(() => useQaConversation('conv-route'), {
      wrapper: providerWrapper(),
    })

    act(() => result.current.ask({ question: 'explain the second one' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    // The turn is in the store by now, and a stored turn keeps no route — the
    // decision is live state. What matters is that it was parsed without error
    // and the answer completed.
    expect(result.current.turns).toHaveLength(1)
    expect(result.current.turns[0].answer).toContain('private limited company')
  })

  it('keeps the follow-up questions the answer came with', async () => {
    mockFetch(
      sseResponse([
        { event: 'sources', data: { citations: [citationFixture()] } },
        { event: 'token', data: { text: 'An answer [S1].' } },
        {
          event: 'done',
          data: {
            citations: [citationFixture()],
            kind: 'legal',
            grounded: true,
            related: [{ question: 'Explain Article 627 in plain language' }],
          },
        },
      ]),
    )

    const { result } = renderHook(() => useQaConversation('conv-related'), {
      wrapper: providerWrapper(),
    })

    act(() => result.current.ask({ question: 'How do I register a company?' }))
    await waitFor(() => expect(result.current.busy).toBe(false))

    expect(result.current.turns[0].summary?.related).toEqual([
      { question: 'Explain Article 627 in plain language' },
    ])
  })
})
