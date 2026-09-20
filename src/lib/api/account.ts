/**
 * GET /api/v1/me — the caller's account, created on first call.
 *
 * There is no sign-up endpoint and no sign-up screen, because with Google there
 * is no such step: the first successful sign-in *is* the registration. Supabase
 * creates the identity, and this call creates the row Seera owns — upserting, so
 * a returning user refreshes their profile and `last_seen_at` instead of
 * erroring on a duplicate.
 *
 * Which of the two happened comes back as `isNew`.
 */

import { endpoints } from './config'
import { requestJson } from './http'
import { accountSchema } from './schemas'
import type { Account } from './types'

export function getAccount(signal?: AbortSignal): Promise<Account> {
  return requestJson(endpoints.me, accountSchema, { signal })
}
