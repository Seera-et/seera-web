# seera-web

Frontend for Seera — a grounded question-answering system over Ethiopian legal
documents. React 19 + TypeScript + Vite SPA, Tailwind 4.

```
seera-web  ──HTTP/JSON + SSE──►  Go API (seera-backend-services)  ──►  Postgres + pgvector
```

No Next.js, no SSR, no server components — the architecture rules are in
[.claude/skills/project-architecture/](.claude/skills/project-architecture/SKILL.md)
and apply to every change.

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
```

That works with no `.env` file: the dev server proxies `/api` and `/healthz` to
`http://localhost:8081`, which is where `docker compose` in the backend repo
publishes the Go API.

### Connecting to the backend

In `../seera-backend-services`:

```bash
cp .env.example .env              # add GEMINI_API_KEY and ADMIN_API_TOKEN
docker compose up -d              # Postgres + pgvector on :5432

# the API in a container as well — publishes host port 8081
docker compose --profile full up --build -d
```

Or run the API on the host instead, which rebuilds faster:

```bash
set -a && source .env && set +a
go run ./cmd/api                  # PORT defaults to 8080
```

The host route uses port 8080, so point the proxy at it:

```bash
# seera-web/.env.local
API_PROXY_TARGET=http://localhost:8080
```

The header shows a live connection indicator (`Connected` / `Degraded` /
`Offline`) driven by `GET /healthz`, so a backend that is not running is visible
rather than silent. Verify by hand with:

```bash
curl localhost:8081/healthz       # {"status":"ok","db":"up"}
```

**A missing provider credential leaves a route unregistered** on purpose, so a 404
from `/api/v1/qa/query` means the backend booted without `GEMINI_API_KEY` — check
its startup log, not this app.

### Environment

Copy [.env.example](.env.example) to `.env.local` when you need to change
anything. Two variables, two consumers:

| Variable | Read by | Default |
|---|---|---|
| `API_PROXY_TARGET` | `vite.config.ts`, dev server only — never bundled | `http://localhost:8081` |
| `VITE_API_BASE_URL` | the browser bundle | empty = same origin, via the proxy |

Set `VITE_API_BASE_URL` to an absolute origin only when talking to the API
directly (then its `CORS_ALLOWED_ORIGINS` must include `http://localhost:5173`).

## Scripts

```bash
npm run dev          # dev server with HMR
npm run typecheck    # tsc, no emit
npm run lint         # eslint
npm run test         # vitest (jsdom + testing-library)
npm run build        # typecheck + production build to dist/
npm run preview      # serve dist/
```

## Layout

Feature-first. A component used by one feature lives in that feature; it moves to
`components/` on its second real consumer, not in anticipation.

```
src/
  app/                  router, providers, layout shell, brand
    layout/             TopNav, AppShell, footer, side rails
    providers/          theme
  components/
    ui/                 the global kit: Button, Card, Badge, Chip, Drawer, …
  features/
    qa/                 the answer flow: streaming, citations, source panel
    explorer/           document browse and the document view
    bookmarks/          saved sources and answers
    history/            questions asked
    home/               landing page
    about/              how answers are produced, limits, privacy, terms
  hooks/                cross-feature hooks (media queries)
  lib/
    api/                the only place that calls fetch, and the query hooks
    store/              localStorage-backed observable stores
    utils/              formatting, class merging
  test/                 setup and render helpers
```

### The API layer

Components never call `fetch`. Everything goes through `lib/api`, which

- validates every response with zod at the boundary and converts snake_case wire
  shapes into camelCase domain types, so a backend contract change fails loudly
  in one file;
- raises a single `ApiError` type carrying the backend's `code`, the request ID
  and whether a retry could help;
- parses the SSE answer stream with `fetch` + `ReadableStream` (`EventSource`
  cannot POST), buffering until `\n\n` because network chunking does not respect
  event framing;
- exposes every read as a TanStack Query hook in `lib/api/queries.ts`, with the
  key derived from every input that changes the result. Retries are skipped for
  failures a retry cannot fix — the `ApiError` already knows which those are.

### Conversations

Threads live in this browser (`features/qa/conversations.ts`), not on the server.
The backend stores no question and no answer text, and there is no auth to own a
thread, so the client keeps the transcript and sends the turns a follow-up needs:

```
POST /api/v1/qa/query
{ "question": "What about for a PLC?", "history": [ {role, text}, … ] }
```

The server rewrites that into a standalone question before retrieval and treats
the earlier turns as context, never as grounding. Only finished turns are stored;
a streaming, cancelled or failed turn stays in memory, so the record contains
answers that actually completed and nothing else.

### Citations

The trust surface, and the part with rules:

- Citation data comes from the response's `citations` array, never from parsing
  answer text. Inline `[S1]` tokens are located only to make them interactive; a
  marker with no match in the array stays plain text instead of becoming a source.
- Every source shows document, article, version and effective date. A repealed
  version says so.
- An abstention renders no sources panel — implying grounding that does not exist
  is worse than showing nothing.

### State

Smallest tier that works: `useState` → URL search params → server cache
(TanStack Query) → context. The chat question, its filters, the thread id and the
open source panel all live in the URL, so any view can be shared or reloaded.
Theme is the only context. There is no Redux or Zustand.

## What is wired and what is not

No screen renders invented data. Where something cannot be known, it says so.

| Screen | State |
|---|---|
| Home | Live. Counters come from `GET /api/v1/corpus/stats`, counted over published versions — zero reads as zero. |
| Chat | Live. Streaming answers, citations, source resolution, abstention, cancel, as-of dates, multi-turn follow-ups, and written replies to messages that are not legal questions. |
| Legal Explorer | Live. `GET /api/v1/documents` with URL-driven filters and paging. |
| Document view | Live. Versions, keyset-paginated articles, and the cited provision highlighted when the URL carries `?chunk=`. |
| Bookmarks | Live, stored in this browser. |
| History | Live: saved conversations, stored in this browser. |
| About | Static content. |
| Accounts, upgrade, document upload | Not wired. Controls are disabled and say why. |

## Tests

`npm run test`. Vitest with jsdom and Testing Library; setup and render helpers
are in `src/test/`.

What is covered is what would be expensive to get wrong:

- **SSE framing** (`lib/api/sse.test.ts`) — the exact bytes the Go handler writes,
  split byte-by-byte and mid-Ethiopic-character.
- **Citation mapping** (`features/qa/markers.test.ts`, `AnswerText.test.tsx`) — a
  marker becomes a source only when the structured citations array vouches for
  it; `[S4]` with no match stays literal text.
- **The answer path** (`features/qa/useQaConversation.test.tsx`) — streaming,
  storing a finished turn, resuming after a reload, sending history on a
  follow-up, and every failure ending with the busy flag cleared.
- **Catalogue surfaces** (`CorpusStats.test.tsx`, `ExplorerPage.test.tsx`) —
  real numbers rendered, an empty corpus distinguished from an over-filtered one,
  and an actionable error state.
