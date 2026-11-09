import { authClient } from '~platform/lib/auth-client'

import type { SendVerificationOtpReq, SignInEmailOtpReq } from './types/request'

export const sendVerificationOtpReq = authClient.emailOtp.sendVerificationOtp

export const sendSignInVerificationOtp = (req: SendVerificationOtpReq) =>
  sendVerificationOtpReq({
    ...req,
    type: 'sign-in',
  })

export const signInEmailOtpReq = authClient.signIn.emailOtp
export const signInEmailOtp = (data: SignInEmailOtpReq) => signInEmailOtpReq(data)

export const signOut = () => authClient.signOut()
