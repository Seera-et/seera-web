import { useSyncExternalStore } from 'react'

/**
 * A tiny observable value backed by localStorage.
 *
 * Bookmarks and history have no backend yet, but they are shared between pages
 * and must stay in step across them. That fails the "local useState" tier and
 * does not justify a global store library, so: one subscribable value per
 * concern, read through useSyncExternalStore.
 *
 * When those endpoints exist, these stores are what gets replaced — the
 * components reading them do not change.
 */
export type LocalStore<T> = {
  get: () => T
  set: (next: T | ((previous: T) => T)) => void
  subscribe: (listener: () => void) => () => void
}

export function createLocalStore<T>(
  key: string,
  fallback: T,
  /** Guards against a stale or hand-edited value written by an older build. */
  isValid: (raw: unknown) => boolean = () => true,
): LocalStore<T> {
  const listeners = new Set<() => void>()

  function load(): T {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return fallback
      const parsed: unknown = JSON.parse(raw)
      return isValid(parsed) ? (parsed as T) : fallback
    } catch {
      return fallback
    }
  }

  let value = load()

  const emit = () => {
    for (const listener of listeners) listener()
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== key) return
    value = load()
    emit()
  })

  return {
    get: () => value,

    set: (next) => {
      value = typeof next === 'function' ? (next as (previous: T) => T)(value) : next
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Quota or private mode: the in-memory value still serves this session.
      }
      emit()
    },

    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

/** Subscribes a component to a store. */
export function useStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get)
}
