/**
 * The literal heading the answer prompt's rule 12 asks the model to use when it
 * adds a section that is explicitly not drawn from the corpus.
 *
 * Must match `rag.GeneralGuidanceHeading` in the backend
 * (internal/rag/grounding.go) exactly — the backend exported that constant so a
 * frontend convention could key on this one string rather than the two sides
 * drifting apart. This is that convention.
 */
export const GENERAL_GUIDANCE_HEADING =
  'General guidance (not verified against the corpus):'

export type SplitAnswer = {
  /** The part drawn from retrieved provisions, with citation markers. */
  sourced: string
  /** The unsourced remainder, or null when there is none. */
  guidance: string | null
}

/**
 * Splits an answer at the general-guidance heading.
 *
 * Rendering the two halves identically is what made this worth doing: the
 * guidance section is prose about Ethiopian law carrying no citations, and set
 * in the same type as the sourced explanation above it, nothing tells a reader
 * which half is which. The backend now also stops calling such an answer
 * grounded; this is the half the reader can actually see.
 *
 * Tolerant of the partial heading that exists mid-stream — until the full
 * string has arrived the text stays in `sourced` and moves across once it
 * completes, which self-corrects within a token or two.
 */
export function splitGuidance(text: string): SplitAnswer {
  const at = text.indexOf(GENERAL_GUIDANCE_HEADING)
  if (at === -1) return { sourced: text, guidance: null }

  const sourced = text.slice(0, at).trimEnd()
  const guidance = text.slice(at + GENERAL_GUIDANCE_HEADING.length).trim()

  // A heading with nothing after it yet is not a section worth framing.
  if (guidance === '') return { sourced, guidance: null }

  return { sourced, guidance }
}
