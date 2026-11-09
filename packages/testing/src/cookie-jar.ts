export type CookieJar = {
  readonly cookies: Map<string, string>
  readonly fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>
}

const isRemoval = (value: string, attributes: ReadonlyArray<string>) =>
  value === '' || attributes.some(attribute => /^\s*max-age=0\s*$/i.test(attribute))

// A fetch that keeps cookies between requests like a browser, plus fixed headers such as Origin.
export const makeCookieJar = (headers: Record<string, string> = {}): CookieJar => {
  const cookies = new Map<string, string>()

  const fetchWithCookies = async (input: string | URL | Request, init?: RequestInit) => {
    const requestHeaders = new Headers(input instanceof Request ? input.headers : undefined)

    new Headers(init?.headers).forEach((value, name) => requestHeaders.set(name, value))

    for (const [name, value] of Object.entries(headers)) {
      requestHeaders.set(name, value)
    }

    if (cookies.size > 0) {
      requestHeaders.set(
        'cookie',
        [...cookies].map(([name, value]) => `${name}=${value}`).join('; '),
      )
    }

    const response = await fetch(input, { ...init, headers: requestHeaders })

    for (const header of response.headers.getSetCookie()) {
      const [pair = '', ...attributes] = header.split(';')
      const separator = pair.indexOf('=')
      const name = pair.slice(0, separator).trim()
      const value = pair.slice(separator + 1).trim()

      if (isRemoval(value, attributes)) {
        cookies.delete(name)
      } else {
        cookies.set(name, value)
      }
    }

    return response
  }

  return { cookies, fetch: fetchWithCookies }
}
