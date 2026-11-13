import { getItem, setItem } from '@inzpro/browser-utils/session-storage'
import type { HistoryLocation, RouterHistory } from '@tanstack/react-router'
import { Effect, Option, Schema } from 'effect'

// Remembers, per browser history entry, the in-app entry the user came from. Nothing goes into the
// URL: entries are identified by the key TanStack Router keeps in `history.state`, and the map
// lives in sessionStorage, so it survives reloads and back/forward within the tab.

const BackOrigin = Schema.Struct({
  href: Schema.String,
  /** The history index of the origin entry, used to step back to it. */
  index: Schema.Int,
})

export type BackOrigin = typeof BackOrigin.Type

const StoredOrigins = Schema.fromJsonString(Schema.Array(Schema.Tuple([Schema.String, BackOrigin])))

const storageKey = 'back-navigation'
const maxStoredOrigins = 50

let origins = new Map<string, BackOrigin>()
const listeners = new Set<() => void>()

type HistoryEntry = Pick<HistoryLocation, 'href' | 'state'>

const entryKey = (location: HistoryEntry) =>
  location.state.__TSR_key ?? location.state.key ?? location.href

const readStoredOrigins = () =>
  Effect.try(() => getItem(storageKey) ?? '[]').pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(StoredOrigins)),
    Effect.map(entries => new Map(entries)),
    Effect.orElseSucceed(() => new Map<string, BackOrigin>()),
    Effect.runSync,
  )

const storeOrigins = () =>
  Schema.encodeEffect(StoredOrigins)([...origins].slice(-maxStoredOrigins)).pipe(
    Effect.flatMap(value => Effect.try(() => setItem(storageKey, value))),
    Effect.ignore,
    Effect.runSync,
  )

let tracking = false

/**
 * Records the origin of every history entry. A push to another page comes from the current page;
 * a push within the same page (search changes) and a replace (redirects) keep the current origin.
 */
export const trackBackNavigation = (history: RouterHistory) => {
  if (tracking) {
    return
  }

  tracking = true
  origins = readStoredOrigins()
  let previous = history.location

  history.subscribe(({ location, action }) => {
    if (action.type === 'PUSH' || action.type === 'REPLACE') {
      const origin =
        action.type === 'PUSH' && location.pathname !== previous.pathname
          ? Option.some({ href: previous.href, index: previous.state.__TSR_index })
          : Option.fromNullishOr(origins.get(entryKey(previous)))

      origins.delete(entryKey(location))
      Option.map(origin, value => origins.set(entryKey(location), value))
      storeOrigins()
      listeners.forEach(listener => listener())
    }

    previous = location
  })
}

export const subscribeBackOrigins = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export const getBackOrigin = (location: HistoryEntry) => origins.get(entryKey(location))
