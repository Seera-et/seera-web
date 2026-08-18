import type { AnswerCitation } from '@/lib/api'
import { langAttr } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { CitationMarker } from './CitationMarker'
import { segmentAnswer, toBlocks } from './markers'

type AnswerTextProps = {
  text: string
  citations: AnswerCitation[]
  /** Draws the blinking caret at the end while tokens are still arriving. */
  streaming?: boolean
  onOpenSource: (chunkId: string) => void
}

/**
 * The answer body: headings, prose and lists, with every `[S1]` turned into an
 * interactive marker resolved against the citations array.
 */
export function AnswerText({
  text,
  citations,
  streaming = false,
  onOpenSource,
}: AnswerTextProps) {
  const byMarker = new Map(citations.map((citation) => [citation.marker, citation]))
  const blocks = toBlocks(text)
  const lastIndex = blocks.length - 1
  const language = langAttr(text)

  return (
    <div className="space-y-3 text-[0.95rem] leading-relaxed text-ink-soft" lang={language}>
      {blocks.map((block, index) => {
        if (block.kind === 'heading') {
          const Tag = block.level === 2 ? 'h3' : 'h4'
          return (
            <Tag
              key={index}
              className={cn(
                'pt-1 font-semibold text-ink',
                block.level === 2 ? 'text-base' : 'text-sm',
              )}
            >
              <Inline
                text={block.text}
                byMarker={byMarker}
                onOpenSource={onOpenSource}
              />
            </Tag>
          )
        }

        if (block.kind === 'list') {
          return (
            <ul key={index} className="ml-1 space-y-1.5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-300"
                  />
                  <span>
                    <Inline
                      text={item}
                      byMarker={byMarker}
                      onOpenSource={onOpenSource}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p
            key={index}
            className={cn(
              'whitespace-pre-line',
              streaming && index === lastIndex && 'caret-stream',
            )}
          >
            <Inline text={block.text} byMarker={byMarker} onOpenSource={onOpenSource} />
          </p>
        )
      })}
    </div>
  )
}

/** One run of text with its markers and emphasis replaced. */
function Inline({
  text,
  byMarker,
  onOpenSource,
}: {
  text: string
  byMarker: Map<string, AnswerCitation>
  onOpenSource: (chunkId: string) => void
}) {
  return (
    <>
      {segmentAnswer(text).map((segment, index) => {
        if (segment.kind === 'text') return <span key={index}>{segment.text}</span>

        if (segment.kind === 'bold') {
          return (
            <strong key={index} className="font-semibold text-ink">
              {/* Emphasis can wrap a cited claim, so its contents are parsed too. */}
              <Inline
                text={segment.text}
                byMarker={byMarker}
                onOpenSource={onOpenSource}
              />
            </strong>
          )
        }

        const resolved = segment.markers
          .map((marker) => byMarker.get(marker))
          .filter((citation): citation is AnswerCitation => citation !== undefined)

        // Nothing resolved: the marker is not a citation this client can vouch
        // for, so it stays literal text rather than becoming a fake source.
        if (resolved.length === 0) return <span key={index}>{segment.raw}</span>

        return (
          <span key={index} className="whitespace-nowrap">
            {resolved.map((citation) => (
              <CitationMarker
                key={citation.chunkId}
                citation={citation}
                onOpen={onOpenSource}
              />
            ))}
          </span>
        )
      })}
    </>
  )
}
