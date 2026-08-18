import { lazy, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@/features/home/HomePage'
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
const BookmarksPage = lazyPage(
  () => import('@/features/bookmarks/BookmarksPage'),
  'BookmarksPage',
)
const HistoryPage = lazyPage(
  () => import('@/features/history/HistoryPage'),
  'HistoryPage',
)
const AboutPage = lazyPage(() => import('@/features/about/AboutPage'), 'AboutPage')

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'explorer', element: <ExplorerPage /> },
      { path: 'documents/:documentId', element: <DocumentPage /> },
      { path: 'bookmarks', element: <BookmarksPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'about', element: <AboutPage /> },
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
