import { getAuthErrorMessage } from '@inzpro/auth-client/error'
import { identityKeys } from '@inzpro/queries/modules/identity'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@inzpro/ui/components/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@inzpro/ui/components/input-otp'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { Schema } from 'effect'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { safeRedirectPath } from '~platform/utils/redirect'

import { signInEmailOtp } from '../actions'
import type { SignInEmailOtpReq } from '../types/request'
import { verifyOTPPageRouteApi } from '../utils'

const verifyOTPSchema = Schema.Struct({
  code: Schema.String.pipe(
    Schema.check(Schema.isMinLength(1, { message: 'Wpisz kod weryfikacyjny.' })),
  ),
})

export const VerifyOTPForm = () => {
  const { email, redirect } = verifyOTPPageRouteApi.useSearch()
  const router = useRouter()

  const signInEmailOtpMutation = useMutation({
    mutationFn: async (data: SignInEmailOtpReq, context) => {
      await signInEmailOtp(data)

      // The next route guard reads the new session instead of a cached signed-out one.
      context.client.removeQueries({ queryKey: identityKeys.all })
    },
    mutationKey: ['signInEmailOtp'],
    onSuccess: () =>
      router.navigate({
        href: safeRedirectPath(redirect),
        replace: true,
      }),
  })

  const form = useForm({
    onSubmit: ({ value }) => {
      toast.promise(
        () =>
          signInEmailOtpMutation.mutateAsync({
            otp: value.code,
            email,
          }),
        {
          loading: 'Weryfikacja kodu...',
          success: 'Zalogowano pomyślnie.',
          error: error => ({
            message: 'Ups! Coś poszło nie tak.',
            description: getAuthErrorMessage(error),
          }),
        },
      )
    },
    defaultValues: {
      code: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: Schema.toStandardSchemaV1(verifyOTPSchema),
    },
  })

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        e.stopPropagation()

        void form.handleSubmit()
      }}
      noValidate
    >
      <FieldGroup className="items-center">
        <form.Field name="code">
          {field => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field
                data-invalid={isInvalid}
                className="w-fit items-center"
              >
                <FieldLabel htmlFor={field.name}>Kod weryfikacyjny</FieldLabel>
                <InputOTP
                  id={field.name}
                  name={field.name}
                  maxLength={6}
                  value={field.state.value}
                  onChange={value => field.handleChange(value)}
                  pattern={REGEXP_ONLY_DIGITS}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  onComplete={() => form.handleSubmit()}
                  disabled={signInEmailOtpMutation.isPending}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                {isInvalid && <FieldError>{field.state.meta.errors[0]?.message}</FieldError>}
              </Field>
            )
          }}
        </form.Field>

        <Button
          type="submit"
          disabled={signInEmailOtpMutation.isPending}
        >
          {signInEmailOtpMutation.isPending && <LoaderCircle className="animate-spin" />}
          Zaloguj się
        </Button>
      </FieldGroup>
    </form>
  )
}
