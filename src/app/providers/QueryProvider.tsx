import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'

/**
 * The server-state cache.
 *
 * Created inside the component rather than at module scope so tests can mount an
 * isolated app, and so a hot reload does not leave two clients behind.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Retrying a 400 or a schema mismatch just repeats the mistake; the
            // API layer already knows which failures a retry could fix.
            retry: (failureCount, error) => {
              if (error instanceof ApiError && !error.retryable) return false
              return failureCount < 2
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
