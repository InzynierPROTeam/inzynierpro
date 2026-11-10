import { getRouteApi } from '@tanstack/react-router'

export const signInPageRouteApi = getRouteApi(
  '/_maybeauthenticated/(public)/_layout/_notauthenticated/logowanie',
)

export const verifyOTPPageRouteApi = getRouteApi(
  '/_maybeauthenticated/(public)/_layout/_notauthenticated/zweryfikuj-otp',
)

export const authenticatedRouteApi = getRouteApi('/_maybeauthenticated/(app)/_authenticated')
