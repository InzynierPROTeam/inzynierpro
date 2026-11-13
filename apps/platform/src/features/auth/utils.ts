import { getRouteApi } from '@tanstack/react-router'

export const signInPageRouteApi = getRouteApi('/(public)/_layout/_notauthenticated/logowanie')

export const verifyOTPPageRouteApi = getRouteApi(
  '/(public)/_layout/_notauthenticated/zweryfikuj-otp',
)

export const authenticatedRouteApi = getRouteApi('/(app)/_authenticated')
