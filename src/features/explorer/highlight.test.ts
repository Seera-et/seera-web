import { describe, expect, it } from 'vitest'
import { SNIPPET_HIGHLIGHT_END, SNIPPET_HIGHLIGHT_START } from '@/lib/api'
import { splitSnippet } from './highlight'

/** Wraps text the way the server's ts_headline options do. */
function mark(text: string): string {
  return `${SNIPPET_HIGHLIGHT_START}${text}${SNIPPET_HIGHLIGHT_END}`
}

describe('splitSnippet', () => {
  it('returns one plain run when nothing matched', () => {
    expect(splitSnippet('A share company is a company whose capital')).toEqual([
      { text: 'A share company is a company whose capital', match: false },
    ])
  })

  it('separates matched runs from the text around them', () => {
    const snippet = `A ${mark('share')} company whose ${mark('capital')} is fixed`

    expect(splitSnippet(snippet)).toEqual([
      { text: 'A ', match: false },
      { text: 'share', match: true },
      { text: ' company whose ', match: false },
      { text: 'capital', match: true },
      { text: ' is fixed', match: false },
    ])
  })

  it('handles a snippet that opens on a match', () => {
    expect(splitSnippet(`${mark('Capital')} of the company`)).toEqual([
      { text: 'Capital', match: true },
      { text: ' of the company', match: false },
    ])
  })

  it('keeps Amharic text intact', () => {
    const snippet = `የ${mark('ንግድ')} ማኅበር`

    expect(splitSnippet(snippet)).toEqual([
      { text: 'የ', match: false },
      { text: 'ንግድ', match: true },
      { text: ' ማኅበር', match: false },
    ])
  })

  it('degrades to plain text when a marker is unclosed', () => {
    // A truncated snippet must not render the rest of the provision as a match,
    // and must not leak the control character onto the page either.
    const parts = splitSnippet(`A ${SNIPPET_HIGHLIGHT_START}share company`)

    expect(parts.every((part) => !part.match)).toBe(true)
    expect(parts.map((part) => part.text).join('')).toBe('A share company')
  })

  it('strips a stray closing marker', () => {
    const parts = splitSnippet(`capital${SNIPPET_HIGHLIGHT_END} is fixed`)

    expect(parts.map((part) => part.text).join('')).toBe('capital is fixed')
    expect(parts.some((part) => part.text.includes(SNIPPET_HIGHLIGHT_END))).toBe(false)
  })

  it('is empty for an empty snippet', () => {
    expect(splitSnippet('')).toEqual([])
  })

  it('never emits a marker character in its output', () => {
    const snippet = `${mark('a')}${mark('b')}${SNIPPET_HIGHLIGHT_START}c`

    for (const part of splitSnippet(snippet)) {
      expect(part.text).not.toContain(SNIPPET_HIGHLIGHT_START)
      expect(part.text).not.toContain(SNIPPET_HIGHLIGHT_END)
    }
  })
})
