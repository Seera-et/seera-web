/**
 * Turning answer text into renderable pieces: citation markers, emphasis, and
 * the block structure the model writes.
 *
 * The rule this respects: citation *data* comes from the structured `citations`
 * array, never from the text. What happens here is only locating the `[S1]`
 * tokens the model was instructed to emit so they can be turned into buttons; the
 * document, article and version behind each one are looked up by marker in the
 * array. A marker with no match in that array is left as plain text rather than
 * rendered as a source.
 *
 * The marker pattern mirrors `markerPattern` in
 * seera-backend-services/internal/rag/grounding.go, including its tolerance of a
 * marker the model decorated — `[S1, Art. 265(1)]`. The server normalises those
 * to `[S1]` before they stream, so this matters for two cases: answers stored
 * before that normalisation existed, and defence in depth if it changes.
 */

/** `[S1]`, `[S1, S3]`, or either of those with trailing text the model added. */
const MARKER_SOURCE = String.raw`\[\s*(S\d+(?:\s*,\s*S\d+)*)([^\]]*)\]`
/** `**bold**`, tolerating the spaces some models put inside the delimiters. */
const BOLD_SOURCE = String.raw`\*\*(.+?)\*\*`

const INLINE_PATTERN = new RegExp(`${MARKER_SOURCE}|${BOLD_SOURCE}`, 'gi')

export type AnswerSegment =
  | { kind: 'text'; text: string }
  /** One `[S1]` or `[S1, S3]` token, split into its individual marker names. */
  | { kind: 'markers'; markers: string[]; raw: string }
  /** Emphasised text, which may itself contain markers. */
  | { kind: 'bold'; text: string }

export function segmentAnswer(text: string): AnswerSegment[] {
  const segments: AnswerSegment[] = []
  let lastIndex = 0

  // A fresh regex per call: a module-level /g regex carries lastIndex between
  // calls, which silently drops markers on the second use.
  const pattern = new RegExp(INLINE_PATTERN.source, 'gi')

  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', text: text.slice(lastIndex, match.index) })
    }

    const [raw, markerList, , boldText] = match
    if (markerList !== undefined) {
      segments.push({
        kind: 'markers',
        // Upper-cased for the same reason the server does it: [s1] means S1.
        markers: markerList.split(',').map((marker) => marker.trim().toUpperCase()),
        raw,
      })
    } else {
      segments.push({ kind: 'bold', text: boldText.trim() })
    }

    lastIndex = match.index + raw.length
  }

  if (lastIndex < text.length) {
    segments.push({ kind: 'text', text: text.slice(lastIndex) })
  }

  return segments
}

/** The ordinal a marker displays: `S3` → 3. */
export function markerNumber(marker: string): number | null {
  const digits = marker.replace(/^S/i, '')
  const value = Number.parseInt(digits, 10)
  return Number.isNaN(value) ? null : value
}

export type TextBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'heading'; level: 2 | 3; text: string }

/**
 * Groups answer text into headings, paragraphs and bullet lists.
 *
 * Not a markdown renderer, and deliberately not: this handles the small subset
 * the answer prompt actually produces — `##`/`###` headings, `-`/`*` bullets, and
 * `**emphasis**` (handled inline above). Running arbitrary markdown over model
 * output on a legal surface buys nothing and risks mangling an article
 * reference; anything unrecognised stays as literal text.
 *
 * Structure is detected per line rather than per blank-line-separated block,
 * because the model writes a heading immediately above its list.
 */
export function toBlocks(text: string): TextBlock[] {
  const blocks: TextBlock[] = []

  let paragraph: string[] = []
  let items: string[] = []

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    blocks.push({ kind: 'paragraph', text: paragraph.join('\n') })
    paragraph = []
  }
  const flushList = () => {
    if (items.length === 0) return
    blocks.push({ kind: 'list', items })
    items = []
  }
  const flush = () => {
    flushParagraph()
    flushList()
  }

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()

    if (line === '') {
      flush()
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flush()
      blocks.push({
        // Everything below h1 renders at the same two sizes; an answer is not a
        // document outline.
        level: heading[1].length <= 2 ? 2 : 3,
        kind: 'heading',
        text: heading[2].trim(),
      })
      continue
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line)
    if (bullet) {
      flushParagraph()
      items.push(bullet[1].trim())
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flush()
  return blocks
}
