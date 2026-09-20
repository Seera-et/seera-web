/**
 * The Business & License Advisor.
 *
 * Two calls: what to ask, and what follows from the answers. Plain JSON, not
 * SSE — the recommendation is deterministic and arrives whole, because nothing
 * on this path is generated. See internal/business.Recommendation.
 */

import { API_PREFIX } from './config'
import { requestJson } from './http'
import { businessIntakeFormSchema, businessRecommendationSchema } from './schemas'
import type { AdviseInput, BusinessIntakeForm, BusinessRecommendation } from './types'

export function getBusinessIntake(signal?: AbortSignal): Promise<BusinessIntakeForm> {
  return requestJson(`${API_PREFIX}/business/intake`, businessIntakeFormSchema, { signal })
}

export function requestAdvice(
  input: AdviseInput,
  signal?: AbortSignal,
): Promise<BusinessRecommendation> {
  // Optional answers are omitted rather than sent as false or 0: the server
  // distinguishes "not answered" from "answered no", and flattening them here
  // would invent an answer on the reader's behalf.
  const body: Record<string, unknown> = { founders: input.founders }
  if (input.activityCode) body.activity_code = input.activityCode
  if (input.capitalBirr !== undefined) body.capital_birr = input.capitalBirr
  if (input.wantsLimitedLiability !== undefined)
    body.wants_limited_liability = input.wantsLimitedLiability
  if (input.raiseFromPublic !== undefined) body.raise_from_public = input.raiseFromPublic
  if (input.foreignOwnership !== undefined) body.foreign_ownership = input.foreignOwnership

  // `body` is passed as an object: http.ts serialises it and sets the content
  // type, so stringifying here would send a JSON-encoded string.
  return requestJson(`${API_PREFIX}/business/advisor`, businessRecommendationSchema, {
    method: 'POST',
    body,
    signal,
  })
}
