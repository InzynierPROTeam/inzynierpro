import { Clock, Effect } from 'effect'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, string | number>>
  }
}

export function loadGoogleTagManager(tagManagerId: string) {
  if (!/^GTM-[A-Z0-9]+$/.test(tagManagerId) || document.getElementById(`gtm-${tagManagerId}`)) {
    return
  }

  window.dataLayer ??= []
  window.dataLayer.push({ 'gtm.start': Effect.runSync(Clock.currentTimeMillis), event: 'gtm.js' })

  const script = document.createElement('script')
  script.id = `gtm-${tagManagerId}`
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(tagManagerId)}`
  document.head.append(script)
}
