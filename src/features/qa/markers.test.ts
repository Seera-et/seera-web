import { describe, expect, it } from 'vitest'
import { markerNumber, segmentAnswer, toBlocks } from './markers'

/**
 * Citation mapping is a trust surface: a marker that resolves to the wrong source,
 * or a stray bracket rendered as a source, is a mis-citation. These cases are the
 * ones that would produce one.
 */
describe('segmentAnswer', () => {
  it('splits text around a single marker', () => {
    expect(segmentAnswer('A company may be formed [S1] by two people.')).toEqual([
      { kind: 'text', text: 'A company may be formed ' },
      { kind: 'markers', markers: ['S1'], raw: '[S1]' },
      { kind: 'text', text: ' by two people.' },
    ])
  })

  it('splits a grouped marker into its members', () => {
    const segments = segmentAnswer('Both apply [S1, S12].')
    expect(segments[1]).toEqual({
      kind: 'markers',
      markers: ['S1', 'S12'],
      raw: '[S1, S12]',
    })
  })

  it('leaves bracketed text that is not a marker alone', () => {
    expect(segmentAnswer('See [the schedule] and [Section 4].')).toEqual([
      { kind: 'text', text: 'See [the schedule] and [Section 4].' },
    ])
  })

  it('finds every marker on repeated calls', () => {
    // Guards against a shared /g regex carrying lastIndex between calls.
    const text = 'One [S1] two [S2] three [S3].'
    const first = segmentAnswer(text).filter((s) => s.kind === 'markers')
    const second = segmentAnswer(text).filter((s) => s.kind === 'markers')
    expect(first).toHaveLength(3)
    expect(second).toEqual(first)
  })

  it('handles a marker at the very start and end', () => {
    const segments = segmentAnswer('[S1] text [S2]')
    expect(segments[0]).toMatchObject({ kind: 'markers', markers: ['S1'] })
    expect(segments.at(-1)).toMatchObject({ kind: 'markers', markers: ['S2'] })
  })

  it('returns nothing for empty text', () => {
    expect(segmentAnswer('')).toEqual([])
  })
})

describe('markerNumber', () => {
  it('reads the ordinal', () => {
    expect(markerNumber('S1')).toBe(1)
    expect(markerNumber('S12')).toBe(12)
  })

  it('returns null for something that is not a marker', () => {
    expect(markerNumber('SX')).toBeNull()
  })
})

describe('toBlocks', () => {
  it('separates paragraphs on blank lines', () => {
    expect(toBlocks('First para.\n\nSecond para.')).toEqual([
      { kind: 'paragraph', text: 'First para.' },
      { kind: 'paragraph', text: 'Second para.' },
    ])
  })

  it('recognises a bullet list, as the abstention message uses', () => {
    const blocks = toBlocks('What might help:\n\n- naming the law\n- citing an article')
    expect(blocks[1]).toEqual({
      kind: 'list',
      items: ['naming the law', 'citing an article'],
    })
  })

  it('starts a list at the first bullet, without needing a blank line', () => {
    // The model writes a lead-in and its bullets as one block.
    expect(toBlocks('Intro line\n- a bullet')).toEqual([
      { kind: 'paragraph', text: 'Intro line' },
      { kind: 'list', items: ['a bullet'] },
    ])
  })

  it('reads the structure of a real answer: heading, then its bullets', () => {
    const blocks = toBlocks(
      '### 1. Share Company\n* Registration is required [S1].\n* Documents must be attached [S1].',
    )
    expect(blocks).toEqual([
      { kind: 'heading', level: 3, text: '1. Share Company' },
      {
        kind: 'list',
        items: ['Registration is required [S1].', 'Documents must be attached [S1].'],
      },
    ])
  })

  it('treats ## and ### as the two heading levels it renders', () => {
    expect(toBlocks('## Top\n### Under')).toEqual([
      { kind: 'heading', level: 2, text: 'Top' },
      { kind: 'heading', level: 3, text: 'Under' },
    ])
  })

  it('drops empty blocks from a trailing newline', () => {
    expect(toBlocks('Only one.\n\n\n')).toHaveLength(1)
  })
})

/**
 * Observed in a real answer: the model decorated its markers with the article
 * number. The server now normalises those away, but answers stored before that
 * still carry them, and they must still resolve to a source rather than sit on
 * the page as unclickable text.
 */
describe('segmentAnswer with decorated markers', () => {
  it('extracts the source number from a marker carrying an article reference', () => {
    const segments = segmentAnswer('Registration is required [S1, Art. 265(1)].')
    expect(segments[1]).toEqual({
      kind: 'markers',
      markers: ['S1'],
      raw: '[S1, Art. 265(1)]',
    })
  })

  it('extracts every source number from a decorated group', () => {
    const segments = segmentAnswer('Both apply [S1, S2, Art. 499].')
    expect(segments[1]).toMatchObject({ kind: 'markers', markers: ['S1', 'S2'] })
  })

  it('normalises a lower-case marker', () => {
    const segments = segmentAnswer('As stated [s3].')
    expect(segments[1]).toMatchObject({ kind: 'markers', markers: ['S3'] })
  })
})

describe('segmentAnswer with emphasis', () => {
  it('splits out bold runs', () => {
    expect(segmentAnswer('**Required Documents**: the memorandum.')).toEqual([
      { kind: 'bold', text: 'Required Documents' },
      { kind: 'text', text: ': the memorandum.' },
    ])
  })

  it('tolerates spaces inside the delimiters', () => {
    expect(segmentAnswer('** Required Documents **')).toEqual([
      { kind: 'bold', text: 'Required Documents' },
    ])
  })

  it('keeps a marker inside a bold run available for rendering', () => {
    const segments = segmentAnswer('**Registration [S1]**')
    expect(segments).toEqual([{ kind: 'bold', text: 'Registration [S1]' }])
    expect(segmentAnswer('Registration [S1]')[1]).toMatchObject({ markers: ['S1'] })
  })
})
