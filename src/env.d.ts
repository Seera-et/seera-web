/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Production API origin. Empty = same origin (the local Vite proxy). */
  readonly VITE_API_BASE_URL?: string;
  /** Supabase project origin, e.g. https://<ref>.supabase.co. */
  readonly VITE_SUPABASE_URL?: string;
  /**
   * Supabase publishable (anon) key.
   *
   * Designed to be shipped in the bundle — it is the project's anonymous
   * identity, not an admin credential, and it is useless without a signed user
   * token. Unlike VITE_ADMIN_API_TOKEN below, this one is safe in Vercel.
   */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  /** Local-development only. Bearer token for the admin ingest endpoint. */
  readonly VITE_ADMIN_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
