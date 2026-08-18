/**
 * GET /healthz — liveness plus a real database check. Used by the connection
 * indicator in the header so "nothing happens when I ask" has a visible cause.
 */

import { endpoints } from './config'
import { requestJson } from './http'
import { healthSchema } from './schemas'
import type { HealthStatus } from './types'

export function getHealth(signal?: AbortSignal): Promise<HealthStatus> {
  return requestJson(endpoints.health, healthSchema, { signal })
}
