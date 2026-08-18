/**
 * Minimal Server-Sent Events reader over `fetch` + ReadableStream.
 *
 * EventSource is not an option: /api/v1/qa/query is a POST with a JSON body.
 *
 * The one thing that matters here is that network chunking has nothing to do
 * with SSE framing — a single read can deliver half an event, or three events
 * and a fragment. So bytes are buffered until a blank line is seen and never
 * interpreted before that.
 */

export type SseFrame = {
  /** The `event:` field. Defaults to `message` per the SSE spec. */
  event: string
  /** Joined `data:` lines, without the trailing newline. */
  data: string
}

const FRAME_BOUNDARY = /\r\n\r\n|\n\n|\r\r/

/** Yields frames as they complete. Returns when the server closes the stream. */
export async function* readSseFrames(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseFrame, void, undefined> {
  const reader = body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      for (;;) {
        const match = FRAME_BOUNDARY.exec(buffer)
        if (!match) break
        const block = buffer.slice(0, match.index)
        buffer = buffer.slice(match.index + match[0].length)
        const frame = parseFrame(block)
        if (frame) yield frame
      }
    }
  } finally {
    // Releasing the lock lets an aborted request tear the connection down
    // instead of leaving it half-read.
    reader.releaseLock()
  }
}

/**
 * Parses one frame block. Returns null for blocks that carry no data — comment
 * lines such as the `: stream open` the API sends to confirm the connection.
 */
function parseFrame(block: string): SseFrame | null {
  let event = 'message'
  const dataLines: string[] = []

  for (const rawLine of block.split(/\r\n|\n|\r/)) {
    if (rawLine === '' || rawLine.startsWith(':')) continue

    const colon = rawLine.indexOf(':')
    const field = colon === -1 ? rawLine : rawLine.slice(0, colon)
    let value = colon === -1 ? '' : rawLine.slice(colon + 1)
    // A single leading space after the colon is part of the framing.
    if (value.startsWith(' ')) value = value.slice(1)

    if (field === 'event') event = value
    else if (field === 'data') dataLines.push(value)
    // `id` and `retry` are irrelevant: this stream is not resumable.
  }

  if (dataLines.length === 0) return null
  return { event, data: dataLines.join('\n') }
}
