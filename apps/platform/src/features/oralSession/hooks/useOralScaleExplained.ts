import { useSyncExternalStore } from 'react'
import {
  ORAL_SCALE_EXPLAINED_EVENT_NAME,
  oralScaleExplainedStore,
} from '~platform/features/oralSession/stores'

const subscribe = (callback: () => void) => {
  window.addEventListener(ORAL_SCALE_EXPLAINED_EVENT_NAME, callback)

  return () => window.removeEventListener(ORAL_SCALE_EXPLAINED_EVENT_NAME, callback)
}

export const useOralScaleExplained = () =>
  useSyncExternalStore(subscribe, oralScaleExplainedStore.get, oralScaleExplainedStore.get)
