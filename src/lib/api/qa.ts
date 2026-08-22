/**
 * The answer path: POST /api/v1/qa/query, streamed.
 *
 * The event order the API guarantees is `route` → `sources` → `token`* →
 * `done`, with `error` in place of `done` on failure.
 */

import { endpoints } from './config'
import { ApiError, isAbortError, toApiError } from './errors'
import { requestStream } from './http'
import {
  doneEventSchema,
  errorEventSchema,
  parseOrThrow,
  routeEventSchema,
  sourcesEventSchema,
  tokenEventSchema,
} from './schemas'
import { readSseFrames } from './sse'
import type {
  AnswerCitation,
  AnswerSummary,
  AskInput,
  RouteInfo,
} from './types'

export type QaStreamHandlers = {
  /** The router decided. Fires first, before anything else, and says which
   * engine is answering and what retrieval was given. */
  onRoute?: (route: RouteInfo) => void
  /** Retrieval finished. Fires once, before the first token — render the source
   * cards here; that is most of the perceived-latency win. */
  onSources?: (citations: AnswerCitation[]) => void
  /** One piece of the answer. Append it to a single string. */
  onToken?: (text: string) => void
}

/**
 * Streams one answer.
 *
 * Resolves with the `done` summary. Throws an {@link ApiError} for a server
 * `error` event, a dropped connection, or a stream that ends without its
 * terminal event. Re-throws AbortError untouched when the caller cancels, so a
 * cancel is never reported as a failure.
 */
export async function streamAnswer(
  input: AskInput,
  handlers: QaStreamHandlers = {},
  signal?: AbortSignal,
): Promise<AnswerSummary> {
  // Built key by key: the handler decodes with DisallowUnknownFields and rejects
  // an explicit null, so an unset filter must be an absent key.
  const body: Record<string, unknown> = { question: input.question }
  if (input.language) body.language = input.language
  if (input.asOf) body.as_of = input.asOf
  if (input.history?.length) body.history = input.history
  if (input.contextChunks?.length) body.context_chunks = input.contextChunks

  const stream = await requestStream(endpoints.qaQuery, body, signal)

  try {
    for await (const frame of readSseFrames(stream)) {
      const payload = decodeFrameData(frame.data)

      switch (frame.event) {
        case 'route': {
          const parsed = parseOrThrow(routeEventSchema, payload, 'route event')
          handlers.onRoute?.(parsed)
          break
        }
        case 'sources': {
          const parsed = parseOrThrow(sourcesEventSchema, payload, 'sources event')
          handlers.onSources?.(parsed.citations ?? [])
          break
        }
        case 'token': {
          const parsed = parseOrThrow(tokenEventSchema, payload, 'token event')
          handlers.onToken?.(parsed.text)
          break
        }
        case 'done': {
          return parseOrThrow(doneEventSchema, payload, 'done event')
        }
        case 'error': {
          const parsed = parseOrThrow(errorEventSchema, payload, 'error event')
          throw new ApiError({
            kind: 'server',
            code: parsed.code,
            message: parsed.message,
            requestId: parsed.request_id ?? undefined,
          })
        }
        default:
          // Forward compatibility: an event this client does not know about is
          // not a reason to abandon an answer that is streaming fine.
          break
      }
    }
  } catch (error) {
    if (isAbortError(error)) throw error
    throw toApiError(error)
  }

  // The loop ended without `done`: the connection dropped mid-answer. Offering a
  // retry is right here, where a server error would not be.
  throw new ApiError({
    kind: 'stream',
    code: 'stream_closed',
    message:
      'The connection closed before the answer finished. The partial answer above may be incomplete.',
  })
}

function decodeFrameData(data: string): unknown {
  try {
    return JSON.parse(data)
  } catch (cause) {
    throw new ApiError({
      kind: 'contract',
      code: 'invalid_event_json',
      message: 'An event on the answer stream was not valid JSON.',
      cause,
    })
  }
}
