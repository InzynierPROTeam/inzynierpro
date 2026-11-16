import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { UAParser } from 'ua-parser-js'

const inAppBrowserTokens =
  /(FBAN|FBAV|FB_IAB|Instagram|Line\/|Line|MicroMessenger|Twitter|TikTok|Snapchat|wv)/i

const isInAppUserAgent = (userAgent: string | undefined) =>
  userAgent !== undefined &&
  (UAParser(userAgent).browser.type === 'inapp' || inAppBrowserTokens.test(userAgent))

export const getIsInAppBrowser = createIsomorphicFn()
  .server(() => isInAppUserAgent(getRequestHeader('user-agent')))
  .client(() => isInAppUserAgent(globalThis.navigator.userAgent))
