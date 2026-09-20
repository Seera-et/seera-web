import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/lib/auth/session'
import { QueryProvider } from './providers/QueryProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { router } from './routes'

/**
 * Providers, then the router. Nothing else belongs here.
 *
 * AuthProvider sits outside the router because the route guard reads the
 * session, and inside QueryProvider is not required — but it must wrap
 * everything that renders a route.
 */
export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <RouterProvider router={router} />
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
