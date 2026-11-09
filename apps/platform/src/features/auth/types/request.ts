import type { sendVerificationOtpReq, signInEmailOtpReq, signInWithGoogleReq } from '../actions'

export type SignInWithGoogleReq = Omit<
  Parameters<typeof signInWithGoogleReq>[0],
  'fetchOptions' | 'provider'
>

export type SendVerificationOtpReq = Omit<
  Parameters<typeof sendVerificationOtpReq>[0],
  'fetchOptions' | 'type'
>

export type SignInEmailOtpReq = Omit<Parameters<typeof signInEmailOtpReq>[0], 'fetchOptions'>
