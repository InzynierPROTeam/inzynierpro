import { useSyncExternalStore } from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { ORAL_CHAMBER_FILTER_EVENT_NAME } from '../stores'
import { getOralQuestionScope, oralChamberFilterStore } from '../utils'

const subscribe = (callback: () => void) => {
  window.addEventListener(ORAL_CHAMBER_FILTER_EVENT_NAME, callback)

  return () => window.removeEventListener(ORAL_CHAMBER_FILTER_EVENT_NAME, callback)
}

export const useOralQuestionScope = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()
  const isChamberFilterOn = () => oralChamberFilterStore.get(selectedPath.id)

  return getOralQuestionScope(
    selectedPath,
    useSyncExternalStore(subscribe, isChamberFilterOn, isChamberFilterOn),
  )
}
