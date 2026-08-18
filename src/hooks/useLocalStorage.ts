import { useCallback, useEffect, useState } from 'react'

/**
 * State persisted to localStorage. Used for preferences (theme) and for the
 * client-only surfaces that have no backend yet (bookmarks, history) — those
 * move to the API when the endpoints exist, and this hook is the seam.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((previous: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => read(key, initialValue))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Private browsing or a full quota. A lost preference is not worth an error.
    }
  }, [key, value])

  // Keeps two tabs in step, which matters most for the theme.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue === null) return
      try {
        setValue(JSON.parse(event.newValue) as T)
      } catch {
        /* ignore an unreadable value written by an older build */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const update = useCallback((next: T | ((previous: T) => T)) => {
    setValue((previous) =>
      typeof next === 'function' ? (next as (p: T) => T)(previous) : next,
    )
  }, [])

  return [value, update]
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}
