import { describe, expect, it } from 'vitest'
import { readSseFrames } from './sse'

/**
 * The framing tests. This is the one piece of the answer path where a bug is both
 * easy to write and invisible until an answer arrives mangled: network chunking
 * has nothing to do with event boundaries, so the parser has to survive a stream
 * split anywhere, including inside a multi-byte character.
 *
 * The wire text below is exactly what internal/qa/service.go writes.
 */

function streamOf(chunks: readonly (string | Uint8Array)[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk)
      }
      controller.close()
    },
  })
}

async function collect(chunks: readonly (string | Uint8Array)[]) {
  const frames = []
  for await (const frame of readSseFrames(streamOf(chunks))) frames.push(frame)
  return frames
}

const WIRE =
  ': stream open\n\n' +
  'event: sources\ndata: {"citations":[{"marker":"S1"}]}\n\n' +
  'event: token\ndata: {"text":"A private "}\n\n' +
  'event: token\ndata: {"text":"limited company [S1]"}\n\n' +
  'event: done\ndata: {"citations":[],"abstained":false}\n\n'

const EXPECTED = [
  { event: 'sources', data: '{"citations":[{"marker":"S1"}]}' },
  { event: 'token', data: '{"text":"A private "}' },
  { event: 'token', data: '{"text":"limited company [S1]"}' },
  { event: 'done', data: '{"citations":[],"abstained":false}' },
]

describe('readSseFrames', () => {
  it('parses a whole stream delivered in one chunk', async () => {
    expect(await collect([WIRE])).toEqual(EXPECTED)
  })

  it('parses the same stream delivered one byte at a time', async () => {
    expect(await collect([...WIRE])).toEqual(EXPECTED)
  })

  it('buffers a frame split across two chunks', async () => {
    const cut = WIRE.indexOf('event: token') + 4
    expect(await collect([WIRE.slice(0, cut), WIRE.slice(cut)])).toEqual(EXPECTED)
  })

  it('ignores comment lines such as the stream-open ping', async () => {
    const frames = await collect([': stream open\n\n: keep-alive\n\n'])
    expect(frames).toEqual([])
  })

  it('reassembles a multi-byte character split across chunks', async () => {
    const bytes = new TextEncoder().encode('event: token\ndata: {"text":"የንግድ"}\n\n')
    // Byte 30 falls inside the Ethiopic text, mid-character.
    const frames = await collect([bytes.slice(0, 30), bytes.slice(30)])
    expect(JSON.parse(frames[0].data)).toEqual({ text: 'የንግድ' })
  })

  it('joins multiple data lines in one frame', async () => {
    const frames = await collect(['event: note\ndata: first\ndata: second\n\n'])
    expect(frames).toEqual([{ event: 'note', data: 'first\nsecond' }])
  })

  it('drops a trailing partial frame rather than reporting half an event', async () => {
    const frames = await collect(['event: token\ndata: {"text":"complete"}\n\nevent: tok'])
    expect(frames).toHaveLength(1)
  })

  it('handles CRLF framing, which a proxy may introduce', async () => {
    const frames = await collect(['event: token\r\ndata: {"text":"x"}\r\n\r\n'])
    expect(frames).toEqual([{ event: 'token', data: '{"text":"x"}' }])
  })
})
