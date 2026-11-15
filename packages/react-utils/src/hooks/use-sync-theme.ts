import { useSyncExternalStore } from 'react'

import type { Theme, ThemeStore } from '../theme.js'

export function useSyncTheme(store: ThemeStore, defaultTheme: Theme = 'system'): Theme {
  // The store reads the request cookie on the server, so SSR and hydration see the saved theme.
  const getTheme = () => store.get() ?? defaultTheme

  return useSyncExternalStore(store.subscribe, getTheme, getTheme)
}
