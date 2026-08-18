import { StrictMode, type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Test helpers: the providers a component needs, and a way to hand it a
 * Server-Sent Events response without a server.
 */

/** A client that fails fast and caches nothing between tests. */
export function testQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })
}

export function withProviders(
  ui: ReactNode,
  { route = '/', strict = false }: { route?: string; strict?: boolean } = {},
) {
  const client = testQueryClient()
  const tree = (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )

  // Opt-in, because StrictMode double-invokes effects and state updaters: most
  // tests are clearer asserting one render pass. Turn it on for anything where
  // repeating an update must not repeat its consequences — the app itself runs
  // in StrictMode, and a store write that happened twice there was invisible
  // here until this existed.
  return strict ? <StrictMode>{tree}</StrictMode> : tree
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderOptions & { route?: string } = {},
) {
  const { route, ...renderOptions } = options
  return render(withProviders(ui, { route }), renderOptions)
}

/** Wrapper form, for renderHook. */
export function providerWrapper({
  route,
  strict,
}: { route?: string; strict?: boolean } = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return withProviders(children, { route, strict })
  }
}

/**
 * Builds an SSE `Response` the way the Go handler writes one, including the
 * opening comment. Frames are delivered in separate chunks so the parser's
 * buffering is exercised rather than bypassed.
 */
export function sseResponse(
  frames: ReadonlyArray<{ event: string; data: unknown }>,
  { status = 200 }: { status?: number } = {},
): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(': stream open\n\n'))
      for (const frame of frames) {
        controller.enqueue(
          encoder.encode(
            `event: ${frame.event}\ndata: ${JSON.stringify(frame.data)}\n\n`,
          ),
        )
      }
      controller.close()
    },
  })

  return new Response(stream, {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  })
}

/** A JSON `Response`, for the plain endpoints. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** The wire shape of one citation, with sensible defaults. */
export function citationFixture(overrides: Record<string, unknown> = {}) {
  return {
    marker: 'S1',
    chunk_id: 'chunk-1',
    article_id: 'article-1',
    version_id: 'version-1',
    document_id: 'document-1',
    document_title: 'Commercial Code',
    issuing_authority: 'Federal Government',
    article_no: '627',
    article_title: 'Formation',
    section_path: ['Book II'],
    language: 'en',
    effective_from: '2021-04-05',
    text: 'A private limited company may be formed by two or more persons.',
    structure_confidence: 'high',
    ...overrides,
  }
}
