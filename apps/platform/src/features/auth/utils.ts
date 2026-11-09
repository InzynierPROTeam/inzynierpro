import { getRouteApi } from '@tanstack/react-router'

export const signInPageRouteApi = getRouteApi('/(public)/_layout/_notauthenticated/login/')

export const verifyOTPPageRouteApi = getRouteApi(
  '/(public)/_layout/_notauthenticated/zweryfikuj-otp',
)
