import { ExternalLink, FileText } from 'lucide-react'
import {
  Badge,
  ButtonLink,
  Callout,
  Drawer,
  ErrorState,
  SkeletonText,
} from '@/components/ui'
import type { ResolvedCitation } from '@/lib/api'
import { useCitation } from '@/lib/api/queries'
import { formatDate } from '@/lib/utils/format'
import { documentPath } from '@/features/explorer/url'

/**
 * The full text of one cited provision, with its version provenance.
 *
 * Opened from an inline marker or a source card. On narrow screens it comes up as
 * a bottom sheet instead of a side panel, because a squeezed split pane is the
 * worst version of this layout.
 */
export function SourceDrawer({
  chunkId,
  onClose,
  asSheet = false,
}: {
  chunkId: string | null
  onClose: () => void
  asSheet?: boolean
}) {
  const { data: citation, isPending, isError, error, refetch } = useCitation(chunkId)

  const title = citation?.documentTitle ?? 'Source'
  const subtitle = citation?.articleNo
    ? `Article ${citation.articleNo}${
        citation.articleTitle ? ` — ${citation.articleTitle}` : ''
      }`
    : undefined

  return (
    <Drawer
      open={chunkId !== null}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      side={asSheet ? 'bottom' : 'right'}
    >
      {chunkId && isPending ? (
        <div className="space-y-4">
          <SkeletonText lines={2} />
          <SkeletonText lines={8} />
        </div>
      ) : null}

      {isError ? <ErrorState error={error} onRetry={() => void refetch()} /> : null}

      {citation ? <SourceBody citation={citation} /> : null}
    </Drawer>
  )
}

function SourceBody({ citation }: { citation: ResolvedCitation }) {
  const isAmharic = citation.language === 'am'
  const effective = formatDate(citation.effectiveFrom)
  const repealed = formatDate(citation.repealedAt)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone="brand">{citation.versionLabel || 'Version not labelled'}</Badge>
        <Badge tone="neutral">{isAmharic ? 'አማርኛ' : 'English'}</Badge>
        {effective ? <Badge tone="neutral">In force from {effective}</Badge> : null}
        {repealed ? <Badge tone="warning">Repealed {repealed}</Badge> : null}
        {citation.pageNo > 0 ? <Badge tone="neutral">Page {citation.pageNo}</Badge> : null}
      </div>

      {repealed ? (
        <Callout tone="warning" title="This version has been repealed">
          It is shown because the answer relied on it. Check whether a later version
          applies to your situation.
        </Callout>
      ) : null}

      {citation.sectionPath.length > 0 ? (
        <p className="text-xs text-ink-muted">{citation.sectionPath.join(' › ')}</p>
      ) : null}

      <div className="rounded-card border border-line bg-surface-sunken p-4">
        <p
          lang={isAmharic ? 'am' : undefined}
          className="whitespace-pre-line text-sm leading-relaxed text-ink"
        >
          {citation.text}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <Meta label="Document ID" value={citation.documentId} />
        <Meta label="Version ID" value={citation.versionId} />
        <Meta label="Chunk ID" value={citation.chunkId} />
        <Meta
          label="Characters"
          value={`${citation.charStart}–${citation.charEnd}`}
        />
      </dl>

      <div className="flex flex-wrap gap-2">
        <ButtonLink
          to={documentPath({
            documentId: citation.documentId,
            versionId: citation.versionId,
            articleNo: citation.articleNo,
            chunkId: citation.chunkId,
          })}
          variant="secondary"
          size="sm"
          leadingIcon={<FileText />}
        >
          Open in document
        </ButtonLink>
        {citation.sourceUrl ? (
          <a
            href={citation.sourceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline dark:text-brand-300"
          >
            <ExternalLink className="size-3.5" />
            Official publication
          </a>
        ) : null}
      </div>
    </div>
  )
}

/** Identifiers are shown because a citation that points at a database record
 * should be checkable against that record. */
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="truncate font-mono text-[0.7rem] text-ink-soft" title={value}>
        {value}
      </dd>
    </div>
  )
}
