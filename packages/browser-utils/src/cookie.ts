import Cookies from 'js-cookie'

export const secureCookieOptions = {
  path: '/',
  sameSite: 'strict',
  secure: true,
} satisfies Cookies.CookieAttributes

const secureCookie = Cookies.withAttributes(secureCookieOptions)

export const getCookie = (key: string) => {
  return secureCookie.get(key) ?? null
}

export const setCookie = (
  key: string,
  value: string,
  options: Cookies.CookieAttributes = { expires: 7 },
) => {
  secureCookie.set(key, value, options)
}

export const removeCookie = (key: string) => {
  secureCookie.remove(key)
}
