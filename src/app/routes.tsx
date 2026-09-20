import { lazy, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/features/home/HomePage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { AppShell } from './layout/AppShell'
import { NotFound, RouteError } from './layout/RouteError'

/**
 * The route table — every URL the app answers, on one screen.
 *
 * Home is eager because it is the landing page; the rest are split per route and
 * resolved by the Suspense boundary in AppShell.
 */
const ChatPage = lazyPage(() => import('@/features/qa/ChatPage'), 'ChatPage')
const ExplorerPage = lazyPage(
  () => import('@/features/explorer/ExplorerPage'),
  'ExplorerPage',
)
const DocumentPage = lazyPage(
  () => import('@/features/explorer/DocumentPage'),
  'DocumentPage',
)
const AdvisorPage = lazyPage(
  () => import('@/features/advisor/AdvisorPage'),
  'AdvisorPage',
)
const BookmarksPage = lazyPage(
  () => import('@/features/bookmarks/BookmarksPage'),
  'BookmarksPage',
)
const HistoryPage = lazyPage(
  () => import('@/features/history/HistoryPage'),
  'HistoryPage',
)
const AboutPage = lazyPage(() => import('@/features/about/AboutPage'), 'AboutPage')
const SignInPage = lazyPage(() => import('@/features/auth/SignInPage'), 'SignInPage')
const AuthCallbackPage = lazyPage(
  () => import('@/features/auth/AuthCallbackPage'),
  'AuthCallbackPage',
)

/**
 * Public routes are the ones a visitor can judge the product by: the landing
 * page, and browsing the law itself. Everything that costs a model call or
 * belongs to one person sits under RequireAuth.
 *
 * The split is expressed as nesting rather than a flag per route, so a new page
 * cannot be added to the protected area and accidentally ship unguarded — it is
 * guarded by where it is written. The same split is enforced independently in
 * the Go router; this one only decides what renders.
 */
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'explorer', element: <ExplorerPage /> },
      { path: 'documents/:documentId', element: <DocumentPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'signin', element: <SignInPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },

      {
        element: <RequireAuth />,
        children: [
          { path: 'chat', element: <ChatPage /> },
          { path: 'advisor', element: <AdvisorPage /> },
          { path: 'bookmarks', element: <BookmarksPage /> },
          { path: 'history', element: <HistoryPage /> },
        ],
      },

      { path: '*', element: <NotFound /> },
    ],
  },
])

/** React.lazy over a named export, so pages keep named exports like everything else. */
function lazyPage<M extends Record<string, unknown>>(
  load: () => Promise<M>,
  name: keyof M & string,
) {
  return lazy(async () => {
    const module = await load()
    return { default: module[name] as ComponentType }
  })
}
