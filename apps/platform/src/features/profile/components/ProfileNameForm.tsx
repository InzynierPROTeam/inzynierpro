import { profileNameMaxLength } from '@inzpro/domain/modules/profiles/profile'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@inzpro/ui/components/field'
import { Input } from '@inzpro/ui/components/input'
import { toast } from '@inzpro/ui/components/toast'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'

import { useRenameProfile } from '../hooks/useRenameProfile'
import { profileRouteApi } from '../utils'
import { profileNameFormSchema } from '../validation'

type ProfileNameFormProps = {
  onDone: () => void
}

export const ProfileNameForm: React.FC<ProfileNameFormProps> = ({ onDone }) => {
  const {
    session: { user },
  } = profileRouteApi.useRouteContext()

  const mutation = useRenameProfile(user.id)

  const form = useForm({
    onSubmit: ({ value }) =>
      toast
        .promise(mutation.mutateAsync(value.name), {
          loading: { title: 'Zapisywanie nazwy...' },
          success: { title: 'Nazwa została zmieniona.' },
          error: { title: 'Nie udało się zmienić nazwy. Spróbuj ponownie.' },
        })
        .then(onDone, () => undefined),
    defaultValues: { name: user.name },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(profileNameFormSchema) },
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
      <form.Field name="name">
        {field => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Nazwa</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Jan Kowalski"
                autoComplete="nickname"
                disabled={mutation.isPending}
                autoFocus
              />
              <FieldDescription className="text-2xs text-right">
                {field.state.value.trim().length}/{profileNameMaxLength} znaków
              </FieldDescription>
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
          disabled={mutation.isPending}
        >
          {mutation.isPending && <LoaderCircle className="animate-spin" />}
          Zapisz nazwę
        </Button>
      </div>
    </form>
  )
}
