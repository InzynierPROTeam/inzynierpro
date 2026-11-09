import type { sendVerificationOtpReq, signInEmailOtpReq } from '../actions'

export type SendVerificationOtpReq = Omit<
  Parameters<typeof sendVerificationOtpReq>[0],
  'fetchOptions' | 'type'
>

export type SignInEmailOtpReq = Omit<Parameters<typeof signInEmailOtpReq>[0], 'fetchOptions'>
