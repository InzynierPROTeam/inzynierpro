import { useMutation } from '@tanstack/react-query'

import { sendSignInVerificationOtp } from '../actions'

type UseSendOTPMutationArgs = {
  onSuccess?: (email: string) => void
}

export const useSendOTPMutation = ({ onSuccess }: UseSendOTPMutationArgs = {}) =>
  useMutation({
    mutationFn: sendSignInVerificationOtp,
    mutationKey: ['sendSignInVerificationOtp'],
    onSuccess: (_, req) => {
      onSuccess?.(req.email)
    },
  })
