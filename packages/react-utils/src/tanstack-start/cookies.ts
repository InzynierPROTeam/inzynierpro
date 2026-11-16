import {
  getCookie as getBrowserCookie,
  setCookie as setBrowserCookie,
  removeCookie as removeBrowserCookie,
  getCookieOptions,
  type CookieOptions,
} from '@inzpro/browser-utils/cookie'
import { createIsomorphicFn } from '@tanstack/react-start'
import {
  getCookie as getServerCookie,
  setCookie as setServerCookie,
  deleteCookie as deleteServerCookie,
  getRequestHeader,
} from '@tanstack/react-start/server'
import { Duration } from 'effect'

export const getCookie = createIsomorphicFn()
  .server((name: string) => getServerCookie(name))
  .client((name: string) => getBrowserCookie(name))

export const setCookie = createIsomorphicFn()
  .server((name: string, value: string, options: CookieOptions = {}) =>
    setServerCookie(name, value, getCookieOptions(options)),
  )
  .client((name: string, value: string, options: CookieOptions = {}) =>
    setBrowserCookie(name, value, options),
  )

export const removeCookie = createIsomorphicFn()
  .server((name: string) => deleteServerCookie(name, getCookieOptions({ maxAge: Duration.zero })))
  .client((name: string) => removeBrowserCookie(name))

export const canSsrWithCookies = createIsomorphicFn()
  .server(() => {
    const site = getRequestHeader('sec-fetch-site')

    // EXTERNAL: SameSite=Strict cookies may be absent on external entry; resolve them in the browser.
    return site === 'same-origin' || site === 'same-site' || site === 'none'
  })
  .client(() => true)
