import { SegmentedControl } from '@/components/ui'
import { LANGUAGE_SEGMENTS, type LanguageChoice } from './language'

/** Source-language filter. See `language.ts` for why "both" is the default. */
export function LanguagePicker({
  value,
  onChange,
  size = 'sm',
}: {
  value: LanguageChoice
  onChange: (value: LanguageChoice) => void
  size?: 'sm' | 'md'
}) {
  return (
    <SegmentedControl
      label="Source language"
      value={value}
      segments={LANGUAGE_SEGMENTS}
      onChange={onChange}
      size={size}
    />
  )
}
