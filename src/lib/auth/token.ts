/**
 * How `lib/api` gets an access token without knowing who issues them.
 *
 * `lib/api/http.ts` is the one place the app calls fetch, and it needs a bearer
 * token. Importing the Supabase client there would put a vendor in the middle
 * of every request path and force every existing api test to stub Supabase to
 * fetch a document. So the auth layer *registers* a getter here instead, and
 * the api layer asks this module.
 *
 * The default returns null, which is exactly right for a signed-out visitor
 * reading the corpus: no header is sent and the public endpoints answer.
 */

type TokenGetter = () => Promise<string | null>

const noToken: TokenGetter = async () => null

let getToken: TokenGetter = noToken

/** Registered once by AuthProvider. */
export function setTokenGetter(getter: TokenGetter): void {
  getToken = getter
}

/** Restores the signed-out default. Used on sign-out and by tests. */
export function clearTokenGetter(): void {
  getToken = noToken
}

/**
 * The current access token, or null.
 *
 * Deliberately async: the token may be expired and need refreshing, and the
 * refresh is a network call. Every caller is already async.
 */
export async function accessToken(): Promise<string | null> {
  try {
    return await getToken()
  } catch {
    // A failed refresh means "not signed in" as far as the request is
    // concerned. The request proceeds without a header and the API answers
    // 401, which the UI already handles by sending the user to sign in —
    // a better outcome than throwing a network error into an unrelated screen.
    return null
  }
}
