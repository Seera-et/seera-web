/**
 * One error type for every failure the API layer can produce, because the UI has
 * to tell them apart: a server error carries a code worth switching on, a
 * dropped connection is worth a retry button, and an abort is not a failure at
 * all.
 */

export type ApiErrorKind =
  /** The server answered with an `{"error":{...}}` body. */
  | 'server'
  /** The request never completed: offline, DNS, connection reset. */
  | 'network'
  /** The stream closed before its terminal event. */
  | 'stream'
  /** The response did not match the schema we validate at the boundary. */
  | 'contract'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** Backend error code, e.g. `quota_exhausted`, `invalid_request`. */
  readonly code: string
  readonly status?: number
  readonly requestId?: string

  constructor(init: {
    kind: ApiErrorKind
    code: string
    message: string
    status?: number
    requestId?: string
    cause?: unknown
  }) {
    super(init.message, { cause: init.cause })
    this.name = 'ApiError'
    this.kind = init.kind
    this.code = init.code
    this.status = init.status
    this.requestId = init.requestId
  }

  /**
   * True when the API refused because nobody is signed in.
   *
   * Worth its own check rather than leaving callers to compare status codes:
   * this is the one failure whose remedy is "sign in", not "try again", and
   * showing it as a generic error would send people to a retry button that can
   * never work. It also covers a session that expired mid-visit, where the
   * client still believes it is signed in.
   */
  get unauthenticated(): boolean {
    return this.status === 401
  }

  /** True when retrying the same request could plausibly succeed. */
  get retryable(): boolean {
    // Retrying with the same (absent or expired) token gets the same 401.
    if (this.unauthenticated) return false
    if (this.kind === 'network' || this.kind === 'stream') return true
    if (this.kind === 'contract') return false
    if (this.status !== undefined && this.status >= 500) return true
    return this.code === 'quota_exhausted' || this.code === 'rate_limited'
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  )
}

export function networkError(cause: unknown): ApiError {
  return new ApiError({
    kind: 'network',
    code: 'network_error',
    message:
      'Could not reach the Seera API. Check that the backend is running, then try again.',
    cause,
  })
}

/** Turns anything thrown into an ApiError so callers handle one shape. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  return networkError(error)
}
