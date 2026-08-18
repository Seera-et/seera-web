/**
 * Placeholder session.
 *
 * Auth does not exist on the backend yet — there is no login endpoint and no
 * token to hold. The header still has to render a user, so it renders this, in
 * one obvious place, ready to be replaced by whatever `GET /api/v1/me` returns.
 */
export type SessionUser = {
  name: string
  email: string
  plan: 'Free Plan' | 'Pro Plan'
}

export const PLACEHOLDER_USER: SessionUser = {
  name: 'Yoseph R.',
  email: 'yoseph@example.com',
  plan: 'Free Plan',
}

/** True once real authentication is wired. Gates anything that would lie. */
export const AUTH_ENABLED = false
