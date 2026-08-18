/**
 * Where the API is and how paths are built. The only place in the frontend that
 * reads import.meta.env for API wiring.
 */

const rawBase = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

/** Empty means same origin, which in dev is the Vite proxy in vite.config.ts. */
export const API_BASE_URL = rawBase.replace(/\/+$/, '')

export const API_PREFIX = '/api/v1'

export function apiUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${suffix}`
}

/** Paths, in one place, matching seera-backend-services/internal/server/routes.go. */
export const endpoints = {
  health: '/healthz',
  qaQuery: `${API_PREFIX}/qa/query`,
  citation: (chunkId: string) =>
    `${API_PREFIX}/citations/${encodeURIComponent(chunkId)}`,
  adminIngest: `${API_PREFIX}/admin/documents/ingest`,
} as const
