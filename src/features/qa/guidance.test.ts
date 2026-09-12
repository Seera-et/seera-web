import { describe, expect, it } from 'vitest'
import { GENERAL_GUIDANCE_HEADING, splitGuidance } from './guidance'

describe('splitGuidance', () => {
  it('leaves an ordinary answer alone', () => {
    const text = 'A private limited company needs fully paid capital [S1].'
    expect(splitGuidance(text)).toEqual({ sourced: text, guidance: null })
  })

  it('separates the unsourced section from the cited explanation', () => {
    const text =
      `Capital must be fully paid [S1].\n\n` +
      `${GENERAL_GUIDANCE_HEADING}\n` +
      `Typically this protects creditors. Verify before relying on it.`

    const { sourced, guidance } = splitGuidance(text)

    expect(sourced).toBe('Capital must be fully paid [S1].')
    expect(guidance).toBe(
      'Typically this protects creditors. Verify before relying on it.',
    )
    // The heading is the frame's job, not the body's.
    expect(guidance).not.toContain(GENERAL_GUIDANCE_HEADING)
  })

  /**
   * Mid-stream the heading arrives a few characters at a time. A partial match
   * must not split, or the block would flicker in and out as tokens land.
   */
  it('does not split on a partially streamed heading', () => {
    const text = 'Capital must be fully paid [S1].\n\nGeneral guidance (not ver'
    expect(splitGuidance(text).guidance).toBeNull()
  })

  it('does not frame an empty section when only the heading has arrived', () => {
    const text = `Capital must be fully paid [S1].\n\n${GENERAL_GUIDANCE_HEADING}`
    expect(splitGuidance(text).guidance).toBeNull()
    expect(splitGuidance(text).sourced).toBe('Capital must be fully paid [S1].')
  })

  /**
   * The one string both sides key on. If the backend's
   * rag.GeneralGuidanceHeading is ever reworded, this is the constant that has
   * to move with it — the section would otherwise silently render as ordinary
   * answer prose again.
   */
  it('matches the heading the backend prompt asks for', () => {
    expect(GENERAL_GUIDANCE_HEADING).toBe(
      'General guidance (not verified against the corpus):',
    )
  })
})
