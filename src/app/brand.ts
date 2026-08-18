/**
 * Product identity in one place.
 *
 * The design mock carries placeholder branding; the product is Seera. Renaming
 * is a change to this file and nothing else.
 */
export const brand = {
  name: 'Seera',
  tagline: 'Ethiopian Legal Assistant',
  /** Shown in the footer. */
  legalYear: 2026,
} as const

/**
 * The disclaimer required on every answering surface (PRD §14). Wording lives
 * here so it cannot drift between the chat page and the home hero.
 */
export const DISCLAIMER =
  'Seera provides information from indexed Ethiopian legal sources with citations. It is not legal advice, and it is not a substitute for a licensed advocate.'
