import { useCallback, useSyncExternalStore } from 'react'

/**
 * Reads a media query reactively, for the layout decisions CSS cannot make alone
 * — such as rendering the source panel as a bottom sheet instead of a side panel.
 *
 * `matchMedia` is an external store, so it is subscribed to rather than mirrored
 * into state by an effect.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/** Tailwind's `lg` breakpoint, where the split layouts appear. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}
