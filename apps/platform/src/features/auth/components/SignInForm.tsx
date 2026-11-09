import { getAuthErrorMessage } from '@inzpro/auth-client/error'
import { Email } from '@inzpro/domain/common/email'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@inzpro/ui/components/field'
import { Input } from '@inzpro/ui/components/input'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import { LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

const signInSchema = Schema.Struct({
  email: Email.annotate({
    message: 'Wpisz poprawny adres e-mail.',
  }),
})

type SignInSchema = typeof signInSchema.Encoded

type SignInFormProps = {
  disabled: boolean
  isLoading: boolean
  onSubmit: (data: SignInSchema) => Promise<void>
  buttonLabel: string
}

export const SignInForm: React.FC<SignInFormProps> = ({
  disabled,
  isLoading,
  onSubmit,
  buttonLabel,
}) => {
  const form = useForm({
    onSubmit: ({ value }) => {
      toast.promise(() => onSubmit(value), {
        loading: 'Wysyłanie kodu weryfikacyjnego...',
        success: 'Kod został wysłany. Sprawdź swoją skrzynkę pocztową.',
        error: error => ({
          message: 'Ups! Coś poszło nie tak.',
          description: getAuthErrorMessage(error),
        }),
      })
    },
    defaultValues: {
      email: '',
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: Schema.toStandardSchemaV1(signInSchema),
    },
  })

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        e.stopPropagation()

        form.handleSubmit()
      }}
      noValidate
    >
      <FieldGroup>
        <form.Field name="email">
          {field => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={e => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="jan.kowalski@gmail.com"
                  disabled={disabled}
                />
                {isInvalid && <FieldError>{field.state.meta.errors[0]?.message}</FieldError>}
              </Field>
            )
          }}
        </form.Field>

        <Button
          type="submit"
          disabled={disabled}
        >
          {isLoading && <LoaderCircle className="animate-spin" />}
          {buttonLabel}
        </Button>
      </FieldGroup>
    </form>
  )
}
