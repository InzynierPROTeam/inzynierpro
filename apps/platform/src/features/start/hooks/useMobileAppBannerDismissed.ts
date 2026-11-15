import { useSyncExternalStore } from 'react'

import { MOBILE_APP_BANNER_DISMISSED_EVENT_NAME, mobileAppBannerStore } from '../store'

const subscribe = (callback: () => void) => {
  window.addEventListener(MOBILE_APP_BANNER_DISMISSED_EVENT_NAME, callback)

  return () => window.removeEventListener(MOBILE_APP_BANNER_DISMISSED_EVENT_NAME, callback)
}

export const useMobileAppBannerDismissed = () =>
  useSyncExternalStore(subscribe, mobileAppBannerStore.get, mobileAppBannerStore.get)
