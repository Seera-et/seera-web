/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Prefix put in front of every API path. Empty = same origin (dev proxy). */
  readonly VITE_API_BASE_URL?: string
  /** Local-development only. Bearer token for the admin ingest endpoint. */
  readonly VITE_ADMIN_API_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
