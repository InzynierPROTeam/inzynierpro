import type { ResetPathError } from '@inzpro/api-client/modules/path-reset'
import type { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import { pathResetConfirmation } from '@inzpro/domain/modules/path-reset/path-reset'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldError, FieldLabel } from '@inzpro/ui/components/field'
import { Input } from '@inzpro/ui/components/input'
import { toast } from '@inzpro/ui/components/toast'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Predicate, Schema } from 'effect'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'
import { useResetPath } from '~platform/features/examPaths/hooks/useResetPath'

import { profileRouteApi } from '../utils'
import { resetPathFormSchema } from '../validation'

type ResetPathFormProps = {
  path: UserQualificationPath
  onDone: () => void
}

const resetErrorTitle = (error: ResetPathError | Error) =>
  Predicate.isTagged(error, 'PathResetConflict')
    ? 'Ścieżka zmieniła się w innym miejscu. Sprawdź ją i spróbuj ponownie.'
    : 'Nie udało się zresetować postępu. Spróbuj ponownie.'

export const ResetPathForm: React.FC<ResetPathFormProps> = ({ path, onDone }) => {
  const {
    session: { user },
  } = profileRouteApi.useRouteContext()

  const mutation = useResetPath(user.id)

  const form = useForm({
    onSubmit: () =>
      toast
        .promise(
          mutation.mutateAsync({
            params: { qualificationPathId: path.id },
            payload: {
              confirmation: pathResetConfirmation,
              expectedVersion: path.version,
            },
          }),
          {
            loading: { title: 'Resetowanie postępu…' },
            success: { title: 'Postęp ścieżki został zresetowany.' },
            error: error => ({ title: resetErrorTitle(error) }),
          },
        )
        .then(onDone, () => undefined),
    defaultValues: { confirmation: '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(resetPathFormSchema) },
  })

  const submitForm = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()

    void form.handleSubmit()
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={submitForm}
      noValidate
    >
      <form.Field name="confirmation">
        {field => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Wpisz {pathResetConfirmation}, aby potwierdzić
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                autoComplete="off"
                disabled={mutation.isPending}
                autoFocus
              />
              {isInvalid && <FieldError>{field.state.meta.errors[0]?.message}</FieldError>}
            </Field>
          )
        }}
      </form.Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={mutation.isPending}
          onClick={onDone}
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <LoaderCircle className="animate-spin" />}
          Resetuj postęp
        </Button>
      </div>
    </form>
  )
}
