/**
 * Citation resolution: GET /api/v1/citations/{chunk_id}.
 *
 * This is the citation resolver only — not a document browse or search API.
 * Those belong to the Knowledge Explorer feature and do not exist on the backend
 * yet.
 */

import { endpoints } from './config'
import { requestJson } from './http'
import { resolvedCitationSchema } from './schemas'
import type { ResolvedCitation } from './types'

export function getCitation(
  chunkId: string,
  signal?: AbortSignal,
): Promise<ResolvedCitation> {
  return requestJson(endpoints.citation(chunkId), resolvedCitationSchema, { signal })
}
