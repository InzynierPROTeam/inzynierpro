import { appNameKebabCase } from '@inzpro/config/app'
import { getCookie, setCookie } from '@inzpro/react-utils/tanstack-start/cookies'
import { Duration } from 'effect'

const dismissedKey = `${appNameKebabCase}.mobile-app-banner-dismissed`
export const MOBILE_APP_BANNER_DISMISSED_EVENT_NAME = 'mobile_app_banner_dismissed_update'

export const mobileAppBannerStore = {
  get: () => getCookie(dismissedKey) === 'true',
  dismiss: () => {
    setCookie(dismissedKey, 'true', { maxAge: Duration.days(365) })
    window.dispatchEvent(new Event(MOBILE_APP_BANNER_DISMISSED_EVENT_NAME))
  },
}
