/**
 * The single place the app calls `fetch`. Components never do (frontend-react
 * skill): they call a function in lib/api and get a domain type or an ApiError.
 */

import type { z } from 'zod'
import { accessToken } from '@/lib/auth/token'
import { apiUrl } from './config'
import { ApiError, isAbortError, networkError } from './errors'
import { errorEnvelopeSchema, parseOrThrow } from './schemas'

type RequestInit_ = {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
}

async function send(path: string, init: RequestInit_): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json', ...init.headers }
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'

  // Attached here and nowhere else, which is also why the SSE answer stream is
  // authenticated for free: requestStream goes through this same function. (An
  // EventSource-based client could not do this — EventSource cannot set
  // headers, which is a large part of why the stream is fetch-based.)
  //
  // Sent whenever a token exists, including on public endpoints: the API reads
  // it there only to charge rate limits to the person rather than to everyone
  // sharing their IP.
  const token = await accessToken()
  if (token) headers.Authorization = `Bearer ${token}`

  try {
    return await fetch(apiUrl(path), {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: init.signal,
    })
  } catch (cause) {
    // An abort is the caller's own doing and must stay distinguishable from a
    // real connection failure.
    if (isAbortError(cause)) throw cause
    throw networkError(cause)
  }
}

/** Reads the `{"error":{...}}` envelope, falling back to the status text. */
async function errorFromResponse(response: Response): Promise<ApiError> {
  let code = `http_${response.status}`
  let message = response.statusText || 'The request failed.'
  let requestId: string | undefined

  try {
    const envelope = errorEnvelopeSchema.safeParse(await response.json())
    if (envelope.success) {
      code = envelope.data.error.code
      message = envelope.data.error.message
      requestId = envelope.data.error.request_id ?? undefined
    }
  } catch {
    // A non-JSON body (a proxy's HTML 502, say) leaves the defaults above.
  }

  if (response.status === 404 && code === 'not_found') {
    // Worth spelling out: the API deliberately leaves a route unregistered when
    // its provider credential is missing, so 404 here is a config problem.
    message =
      'That endpoint is not registered on the API. It is usually a missing provider credential — check the backend startup log.'
  }
  if (response.status === 401) {
    code = 'unauthorized'
    message = 'Your session has ended. Sign in again to continue.'
  }
  if (response.status === 429) {
    code = 'rate_limited'
    message = 'Too many requests. Wait a moment and try again.'
  }

  return new ApiError({
    kind: 'server',
    code,
    message,
    status: response.status,
    requestId,
  })
}

/** GET/POST returning validated JSON. */
export async function requestJson<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit_ = {},
): Promise<T> {
  const response = await send(path, init)
  if (!response.ok) throw await errorFromResponse(response)

  let payload: unknown
  try {
    payload = await response.json()
  } catch (cause) {
    throw new ApiError({
      kind: 'contract',
      code: 'invalid_json',
      message: 'The API response was not valid JSON.',
      status: response.status,
      cause,
    })
  }

  return parseOrThrow(schema, payload, 'response')
}

/**
 * POST expecting `text/event-stream`.
 *
 * Everything that can fail before the first byte is turned into an ApiError
 * here, because once the stream is open the status is already 200 and failures
 * arrive as an `error` event instead.
 */
export async function requestStream(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const response = await send(path, {
    method: 'POST',
    body,
    signal,
    headers: { Accept: 'text/event-stream' },
  })

  if (!response.ok) throw await errorFromResponse(response)

  if (!response.body) {
    throw new ApiError({
      kind: 'stream',
      code: 'no_stream',
      message: 'This browser did not provide a readable response stream.',
      status: response.status,
    })
  }

  return response.body
}
