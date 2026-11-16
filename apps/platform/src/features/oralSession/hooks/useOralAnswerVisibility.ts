import { useSyncExternalStore } from 'react'

import { ORAL_ANSWER_VISIBILITY_EVENT_NAME, oralAnswerVisibilityStore } from '../store'

const subscribe = (callback: () => void) => {
  window.addEventListener(ORAL_ANSWER_VISIBILITY_EVENT_NAME, callback)

  return () => window.removeEventListener(ORAL_ANSWER_VISIBILITY_EVENT_NAME, callback)
}

export const useOralAnswerVisibility = () =>
  useSyncExternalStore(subscribe, oralAnswerVisibilityStore.get, oralAnswerVisibilityStore.get)
