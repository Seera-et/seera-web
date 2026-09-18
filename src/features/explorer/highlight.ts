import { SNIPPET_HIGHLIGHT_END, SNIPPET_HIGHLIGHT_START } from '@/lib/api'

export type SnippetPart = { text: string; match: boolean }

/**
 * Splits a server snippet into plain and highlighted runs.
 *
 * The reason this is a parser rather than `dangerouslySetInnerHTML` over
 * `<mark>` tags: the input is legal text from the corpus, and there must be no
 * path from a document's contents to markup the browser executes. Anything
 * unbalanced degrades to plain text, which is the safe direction to fail in.
 */
export function splitSnippet(snippet: string): SnippetPart[] {
  const parts: SnippetPart[] = []
  let rest = snippet

  while (rest.length > 0) {
    const start = rest.indexOf(SNIPPET_HIGHLIGHT_START)
    if (start === -1) break

    const end = rest.indexOf(SNIPPET_HIGHLIGHT_END, start)
    // An opening marker with no close is a truncated snippet. Keeping the rest
    // as plain text beats rendering half the provision as a match.
    if (end === -1) break

    if (start > 0) parts.push({ text: rest.slice(0, start), match: false })
    const matched = rest.slice(start + SNIPPET_HIGHLIGHT_START.length, end)
    if (matched) parts.push({ text: matched, match: true })
    rest = rest.slice(end + SNIPPET_HIGHLIGHT_END.length)
  }

  if (rest.length > 0) parts.push({ text: rest, match: false })

  // Strip any stray markers that survived an unbalanced tail, so a control
  // character never reaches the page.
  return parts.map((part) => ({
    ...part,
    text: part.text
      .split(SNIPPET_HIGHLIGHT_START)
      .join('')
      .split(SNIPPET_HIGHLIGHT_END)
      .join(''),
  }))
}
