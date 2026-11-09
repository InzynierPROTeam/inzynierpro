import { authClient } from '~platform/lib/auth-client'

import type {
  SendVerificationOtpReq,
  SignInEmailOtpReq,
  SignInWithGoogleReq,
} from './types/request'

export const signInWithGoogleReq = authClient.signIn.social

export const signInWithGoogle = (req: SignInWithGoogleReq) =>
  signInWithGoogleReq({ ...req, provider: 'google' })

export const sendVerificationOtpReq = authClient.emailOtp.sendVerificationOtp

export const sendSignInVerificationOtp = (req: SendVerificationOtpReq) =>
  sendVerificationOtpReq({
    ...req,
    type: 'sign-in',
  })

export const signInEmailOtpReq = authClient.signIn.emailOtp
export const signInEmailOtp = (data: SignInEmailOtpReq) => signInEmailOtpReq(data)

export const signOut = () => authClient.signOut()
