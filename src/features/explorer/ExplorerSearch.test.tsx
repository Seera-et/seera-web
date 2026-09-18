import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jsonResponse, renderWithProviders } from '@/test/utils'
import { SNIPPET_HIGHLIGHT_END, SNIPPET_HIGHLIGHT_START } from '@/lib/api'
import { ExplorerPage } from './ExplorerPage'

/** The wire shape of one search hit. */
function hitFixture(overrides: Record<string, unknown> = {}) {
  return {
    document_id: 'doc-1',
    document_title: 'Commercial Code of Ethiopia',
    doc_type: 'code',
    issuing_authority: 'Federal Government',
    language: 'en',
    version_id: 'ver-1',
    version_label: '2021',
    version_status: 'published',
    article_id: 'art-1',
    article_no: '245',
    article_title: 'Definition',
    chapter: '',
    section_path: ['Book 2', 'Title 6'],
    ordinal: 245,
    chunk_id: 'chunk-1',
    snippet: `A ${SNIPPET_HIGHLIGHT_START}share${SNIPPET_HIGHLIGHT_END} company is a company whose capital is fixed`,
    structure_confidence: 'high',
    score: 0.031,
    matched_by: ['keyword', 'vector'],
    ...overrides,
  }
}

function searchResponse(overrides: Record<string, unknown> = {}) {
  return {
    hits: [hitFixture()],
    total: 108,
    capped: true,
    mode: 'hybrid',
    article_refs: [],
    limit: 20,
    offset: 0,
    ...overrides,
  }
}

/**
 * Routes by path, because the page asks for corpus stats as well as results and
 * a single stubbed body would be parsed against the wrong schema.
 */
function stubRoutes(bodies: { search?: unknown; stats?: unknown }, status = 200) {
  const urls: string[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    urls.push(url)
    if (url.includes('/corpus/stats')) {
      return jsonResponse(
        bodies.stats ?? {
          documents: 2,
          versions: 2,
          articles: 878,
          chunks: 879,
          languages: [],
          doc_types: [],
          domains: [{ domain: 'Commercial Law', documents: 1, articles: 823 }],
          last_published_at: null,
        },
      )
    }
    if (url.includes('/documents/search')) {
      return jsonResponse(bodies.search ?? searchResponse(), status)
    }
    return jsonResponse({ documents: [], total: 0, limit: 24, offset: 0 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return urls
}

describe('ExplorerPage provision search', () => {
  it('prompts rather than searching when the box is empty', async () => {
    stubRoutes({})

    renderWithProviders(<ExplorerPage />, { route: '/explorer?in=provisions' })

    expect(await screen.findByText('Search the text of the law')).toBeInTheDocument()
  })

  it('renders matched provisions with their source and matching arms', async () => {
    stubRoutes({})

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?in=provisions&q=share%20company',
    })

    expect(
      await screen.findByRole('heading', { name: /Article 245 — Definition/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Commercial Code of Ethiopia/)).toBeInTheDocument()

    // Which arm found it is the difference between "uses your words" and "is
    // about your question", and the reader is shown both. Queried by the
    // explanation rather than the label, because the label is deliberately the
    // same word as the mode toggle's.
    expect(
      screen.getByTitle('The provision uses the words you searched for.'),
    ).toBeInTheDocument()
    expect(
      screen.getByTitle('The provision is about what you asked, in different words.'),
    ).toBeInTheDocument()
  })

  it('marks the matched terms without rendering markup', async () => {
    stubRoutes({})

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?in=provisions&q=share',
    })

    await screen.findByRole('heading', { name: /Article 245/ })

    const marked = screen.getByText('share')
    expect(marked.tagName).toBe('MARK')
    // The control characters must never survive into the document.
    expect(document.body.textContent).not.toContain(SNIPPET_HIGHLIGHT_START)
    expect(document.body.textContent).not.toContain(SNIPPET_HIGHLIGHT_END)
  })

  it('states that a capped total is a floor, not a count', async () => {
    stubRoutes({})

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?in=provisions&q=share',
    })

    expect(await screen.findByText(/More than 108 provisions ranked/)).toBeInTheDocument()
  })

  it('reports an exact total when nothing was truncated', async () => {
    stubRoutes({ search: searchResponse({ total: 3, capped: false }) })

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?in=provisions&q=share',
    })

    const summary = await screen.findByText(/3 provisions ranked/)
    expect(summary.textContent).not.toContain('More than')
  })

  it('says so when the semantic arm was unavailable', async () => {
    // The reader asked for hybrid; the deployment answered keyword-only. Left
    // unsaid, they would conclude "Meaning" and "Wording" are the same thing.
    stubRoutes({ search: searchResponse({ mode: 'keyword' }) })

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?in=provisions&q=share',
    })

    expect(await screen.findByText('Matching on wording only')).toBeInTheDocument()
  })

  it('explains that an article number was looked up directly', async () => {
    stubRoutes({ search: searchResponse({ article_refs: ['245'] }) })

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?in=provisions&q=article%20245',
    })

    expect(
      await screen.findByText(/Article 245 looked up directly and placed first/),
    ).toBeInTheDocument()
  })

  it('links a hit into the viewer at that provision', async () => {
    stubRoutes({})

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?in=provisions&q=share',
    })

    const link = await screen.findByRole('link', { name: /Read in context/ })
    const href = link.getAttribute('href') ?? ''

    expect(href).toContain('/documents/doc-1')
    expect(href).toContain('article=245')
    expect(href).toContain('version=ver-1')
    // The cursor is one before the target ordinal, so paging "after" it returns
    // the provision itself on the first page.
    expect(href).toContain('from=244')
  })

  it('passes every filter to the search endpoint', async () => {
    const urls = stubRoutes({})

    renderWithProviders(<ExplorerPage />, {
      route:
        '/explorer?in=provisions&q=capital&mode=semantic&lang=am&type=code&domain=Commercial+Law&year=2021',
    })

    await screen.findByRole('heading', { name: /Article 245/ })

    const search = urls.find((url) => url.includes('/documents/search'))
    expect(search).toBeDefined()
    expect(search).toContain('q=capital')
    expect(search).toContain('mode=semantic')
    expect(search).toContain('language=am')
    expect(search).toContain('type=code')
    expect(search).toContain('domain=Commercial+Law')
    expect(search).toContain('year=2021')
  })

  it('distinguishes no lexical match from no match at all', async () => {
    stubRoutes({ search: searchResponse({ hits: [], total: 0, mode: 'keyword' }) })

    renderWithProviders(<ExplorerPage />, {
      route: '/explorer?in=provisions&q=zzz&mode=keyword',
    })

    expect(await screen.findByText('No provision matches')).toBeInTheDocument()
    // Keyword-specific advice: the point is that "Meaning" may still find it.
    expect(screen.getByText(/Try "Meaning" instead/)).toBeInTheDocument()
  })

  it('offers the ingested domains as browse categories', async () => {
    stubRoutes({})

    renderWithProviders(<ExplorerPage />, { route: '/explorer' })

    expect(
      await screen.findByRole('button', { name: /Commercial Law/ }),
    ).toBeInTheDocument()
  })

  it('switches scope through the URL so a search stays shareable', async () => {
    stubRoutes({})

    renderWithProviders(<ExplorerPage />, { route: '/explorer?q=share' })

    await userEvent.click(screen.getByRole('radio', { name: 'Provisions' }))

    expect(
      await screen.findByRole('heading', { name: /Article 245/ }),
    ).toBeInTheDocument()
  })
})
