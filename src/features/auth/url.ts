/**
 * Where to send someone after they sign in.
 *
 * The destination travels in the URL rather than in router state because it has
 * to survive a full round trip out to Google and back, through a page load the
 * app does not control. Router state does not survive that; a query parameter
 * does.
 */

export const NEXT_PARAM = 'next'

/** The sign-in URL, remembering where the visitor was headed. */
export function signInPath(next?: string): string {
  if (!next || next === '/') return '/signin'
  return `/signin?${NEXT_PARAM}=${encodeURIComponent(next)}`
}

/**
 * Reads the post-sign-in destination, refusing anything that is not a path on
 * this site.
 *
 * Without this check `next` is an open redirect: a link to
 * `seera.site/signin?next=https://evil.example` would bounce a freshly
 * authenticated user off-site, and the address bar would have said seera.site
 * the whole way. Protocol-relative URLs (`//evil.example`) and backslash
 * variants are the usual ways past a naive check, so the test is "starts with
 * exactly one slash", not "starts with a slash".
 */
export function readNext(params: URLSearchParams, fallback = '/'): string {
  const next = params.get(NEXT_PARAM)
  if (!next) return fallback
  if (!next.startsWith('/')) return fallback
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}
