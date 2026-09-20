import { StrictMode, type ReactElement, type ReactNode } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type AuthUser,
} from '@/lib/auth/context'

/**
 * Test helpers: the providers a component needs, and a way to hand it a
 * Server-Sent Events response without a server.
 */

export const testUser: AuthUser = {
  id: 'user-test-1',
  email: 'abebe@example.com',
  name: 'Abebe Bekele',
  avatarUrl: null,
}

/**
 * A session under the test's control, rather than the real provider.
 *
 * The real AuthProvider talks to Supabase, which is not configured under test —
 * and more importantly a test asserting on a guard needs to *choose* whether
 * someone is signed in. Defaults to signed-in because most components that read
 * the session live behind the guard, so that is their real-world condition.
 */
export function stubAuth(status: AuthStatus = 'signed-in'): AuthContextValue {
  return {
    status,
    user: status === 'signed-in' ? testUser : null,
    configured: true,
    signInWithGoogle: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
  }
}

/** A client that fails fast and caches nothing between tests. */
export function testQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
    },
  })
}

export type ProviderOptions = {
  route?: string
  strict?: boolean
  /** The session to render under. A status is shorthand for the usual shapes. */
  auth?: AuthStatus | AuthContextValue
}

export function withProviders(
  ui: ReactNode,
  { route = '/', strict = false, auth = 'signed-in' }: ProviderOptions = {},
) {
  const client = testQueryClient()
  const session = typeof auth === 'string' ? stubAuth(auth) : auth
  const tree = (
    <AuthContext.Provider value={session}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>
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
  options: RenderOptions & ProviderOptions = {},
) {
  const { route, strict, auth, ...renderOptions } = options
  return render(withProviders(ui, { route, strict, auth }), renderOptions)
}

/** Wrapper form, for renderHook. */
export function providerWrapper({ route, strict, auth }: ProviderOptions = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return withProviders(children, { route, strict, auth })
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
