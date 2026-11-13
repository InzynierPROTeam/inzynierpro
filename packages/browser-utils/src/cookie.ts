import { Duration } from 'effect'
import Cookies from 'js-cookie'

export const secureCookieOptions = {
  path: '/',
  sameSite: 'strict',
  secure: true,
} as const

export type CookieOptions = {
  maxAge?: Duration.Duration
}

export const getCookieOptions = (options: CookieOptions = {}) => ({
  ...secureCookieOptions,
  maxAge: Duration.toSeconds(options.maxAge ?? Duration.days(7)),
})

export const getCookie = (key: string) => {
  return Cookies.get(key) ?? null
}

export const setCookie = (key: string, value: string, options: CookieOptions = {}) => {
  const { maxAge, ...attributes } = getCookieOptions(options)

  Cookies.set(key, value, { ...attributes, 'max-age': String(maxAge) })
}

export const removeCookie = (key: string) => {
  Cookies.remove(key, secureCookieOptions)
}
