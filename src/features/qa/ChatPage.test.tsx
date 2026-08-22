import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { citationFixture, renderWithProviders, sseResponse } from '@/test/utils'
import { ChatPage } from './ChatPage'
import { appendTurn, type StoredTurn } from './conversations'

/**
 * The URL contract of the chat page: `?q=` asks on arrival, `?c=` resumes a
 * thread, and the two together must not turn a page refresh into a second
 * identical question.
 */

const EMPTY_TIMINGS = {
  condense: 0,
  retrieval: 0,
  expand: 0,
  carriedSources: 0,
  rerank: 0,
  firstToken: 0,
  total: 0,
  candidates: 0,
  contextChunks: 0,
}

function storedTurn(question: string, answer: string): StoredTurn {
  return {
    id: crypto.randomUUID(),
    question,
    answer,
    citations: [],
    abstained: false,
    grounded: true,
    askedAt: Date.now(),
    model: 'gemini-3.5-flash',
    reranker: 'cohere',
    timings: EMPTY_TIMINGS,
    requestId: null,
  }
}

function stubAnswer() {
  const bodies: unknown[] = []
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    bodies.push(init?.body ? JSON.parse(String(init.body)) : undefined)
    return answerStream()
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, bodies }
}

function answerStream() {
  return sseResponse([
      { event: 'sources', data: { citations: [citationFixture()] } },
      { event: 'token', data: { text: 'A fresh answer [S1].' } },
      {
        event: 'done',
        data: {
          citations: [citationFixture()],
          abstained: false,
          grounded: true,
          timings_ms: { condense: 0, retrieval: 10, rerank: 5, first_token: 20, total: 30 },
          model: 'gemini-3.5-flash',
          reranker: 'cohere',
        },
      },
    ])
}

describe('ChatPage', () => {
  it('asks the question carried in the URL', async () => {
    const { fetchMock, bodies } = stubAnswer()

    renderWithProviders(<ChatPage />, {
      route: '/chat?q=How%20do%20I%20register%20a%20company%3F',
    })

    expect(await screen.findByText(/A fresh answer/)).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(bodies[0]).toMatchObject({ question: 'How do I register a company?' })
  })

  it('restores a thread instead of re-asking it on reload', async () => {
    const { fetchMock } = stubAnswer()
    const conversationId = 'thread-reload'
    appendTurn(
      conversationId,
      storedTurn('How do I register a company?', 'The stored answer.'),
    )

    // The URL a refresh would produce: the thread and the question it ends with.
    renderWithProviders(<ChatPage />, {
      route: `/chat?c=${conversationId}&q=How%20do%20I%20register%20a%20company%3F`,
    })

    expect(await screen.findByText('The stored answer.')).toBeInTheDocument()

    // The whole point: no second request, and no duplicated turn.
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getAllByText('How do I register a company?')).toHaveLength(1)
  })

  it('shows the transcript of a resumed thread', async () => {
    const conversationId = 'thread-resume'
    appendTurn(conversationId, storedTurn('First question?', 'First answer.'))
    appendTurn(conversationId, storedTurn('Second question?', 'Second answer.'))
    stubAnswer()

    renderWithProviders(<ChatPage />, { route: `/chat?c=${conversationId}` })

    expect(await screen.findByText('First answer.')).toBeInTheDocument()
    expect(screen.getByText('Second answer.')).toBeInTheDocument()
    expect(screen.getByText(/2 questions in this thread/)).toBeInTheDocument()
  })

  it('starts empty with suggestions when there is no question or thread', () => {
    stubAnswer()
    renderWithProviders(<ChatPage />, { route: '/chat' })

    expect(screen.getByText('Ask about Ethiopian law')).toBeInTheDocument()
  })
})
