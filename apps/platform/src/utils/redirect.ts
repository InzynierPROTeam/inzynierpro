export const defaultSignedInPath = '/start'

// Only same-origin paths are followed after sign-in, so a crafted link cannot send users away.
export const safeRedirectPath = (value: string | undefined) => {
  if (value === undefined || !value.startsWith('/') || value.startsWith('//')) {
    return defaultSignedInPath
  }

  const url = new URL(value, 'https://platform.invalid')

  return url.origin === 'https://platform.invalid'
    ? `${url.pathname}${url.search}${url.hash}`
    : defaultSignedInPath
}
