import { useState } from 'react'
import { initials } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'

/**
 * Avatar with an initials fallback.
 *
 * `src` is the Google profile picture from the session. It is hosted on
 * googleusercontent.com and can fail for reasons that have nothing to do with
 * this app — an expired URL, a blocked third-party image, an offline visitor —
 * so a failure falls back to initials rather than leaving a broken image in the
 * header.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string
  src?: string | null
  size?: 'sm' | 'md'
  className?: string
}) {
  // Remembers *which* url failed rather than that one did, so a new user (or a
  // changed picture) gets a fresh attempt without an effect resetting a flag.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = src != null && src === failedSrc

  const shape = cn(
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    size === 'sm' ? 'size-8 text-xs' : 'size-10 text-sm',
    className,
  )

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className={cn(shape, 'object-cover')}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(shape, 'bg-brand-600 font-semibold text-white')}
    >
      {initials(name)}
    </span>
  )
}
