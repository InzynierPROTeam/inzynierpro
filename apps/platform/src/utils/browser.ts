import { UAParser } from 'ua-parser-js'

const inAppBrowserTokens =
  /(FBAN|FBAV|FB_IAB|Instagram|Line\/|Line|MicroMessenger|Twitter|TikTok|Snapchat|wv)/i

export const getIsInAppBrowser = () => {
  if (!('navigator' in globalThis)) {
    return false
  }

  const userAgent = globalThis.navigator.userAgent
  const parser = UAParser(userAgent)

  return parser.browser.type === 'inapp' || inAppBrowserTokens.test(userAgent)
}
