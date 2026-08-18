import { ArrowRight, BookOpen } from 'lucide-react'
import { Badge, ButtonLink, Card, CardTitle, IconTile } from '@/components/ui'
import type { DocumentSummary } from '@/lib/api'
import { formatDate, formatNumber } from '@/lib/utils/format'
import { DOC_TYPE_LABELS } from './labels'
import { documentPath } from './url'

export function DocumentCard({ document }: { document: DocumentSummary }) {
  const isAmharic = document.language === 'am'
  const effective = formatDate(
    document.version.effectiveFrom ?? document.effectiveDate,
  )

  return (
    <Card as="li" interactive className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <IconTile>
          <BookOpen />
        </IconTile>
        <div className="min-w-0 flex-1">
          <CardTitle
            as="h3"
            className="text-sm leading-snug"
            lang={isAmharic ? 'am' : undefined}
          >
            {document.title}
          </CardTitle>
          <p className="mt-0.5 truncate text-xs text-ink-muted">
            {DOC_TYPE_LABELS[document.docType]}
            {document.issuingAuthority ? ` · ${document.issuingAuthority}` : ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="neutral">{isAmharic ? 'አማርኛ' : 'English'}</Badge>
        <Badge tone="neutral">
          {formatNumber(document.version.articleCount)} articles
        </Badge>
        {effective ? <Badge tone="neutral">In force from {effective}</Badge> : null}
        {document.version.repealedAt ? (
          <Badge tone="warning">Repealed</Badge>
        ) : null}
      </div>

      <ButtonLink
        to={documentPath({ documentId: document.id })}
        variant="secondary"
        size="sm"
        className="mt-auto w-full justify-between"
        trailingIcon={<ArrowRight />}
      >
        Open
      </ButtonLink>
    </Card>
  )
}
