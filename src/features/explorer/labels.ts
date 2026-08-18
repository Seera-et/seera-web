import type { DocType } from '@/lib/api'

/** Display names for the document types the corpus stores. */
export const DOC_TYPE_LABELS: Record<DocType, string> = {
  proclamation: 'Proclamation',
  regulation: 'Regulation',
  directive: 'Directive',
  code: 'Code',
  other: 'Other',
}

export const DOC_TYPE_OPTIONS = [
  { value: '', label: 'All document types' },
  ...(Object.entries(DOC_TYPE_LABELS) as Array<[DocType, string]>).map(
    ([value, label]) => ({ value, label }),
  ),
]

export function isDocType(value: string | null): value is DocType {
  return value !== null && value in DOC_TYPE_LABELS
}
