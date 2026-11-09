import { useSyncExternalStore } from 'react'

import type { Theme, ThemeStore } from '../theme.js'

export function useSyncTheme(store: ThemeStore, defaultTheme: Theme = 'system'): Theme {
  return useSyncExternalStore(
    store.subscribe,
    () => store.get() ?? defaultTheme,
    () => defaultTheme,
  )
}
