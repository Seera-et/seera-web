import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './providers/QueryProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { router } from './routes'

/** Providers, then the router. Nothing else belongs here. */
export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ThemeProvider>
  )
}
