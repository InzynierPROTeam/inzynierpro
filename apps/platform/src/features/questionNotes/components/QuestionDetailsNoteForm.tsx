import type { QuestionNote } from '@inzpro/api-contracts/modules/learning/responses'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldError, FieldLabel } from '@inzpro/ui/components/field'
import { Textarea } from '@inzpro/ui/components/textarea'
import { toast } from '@inzpro/ui/components/toast'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'
import { useId } from 'react'

import { questionNoteFormSchema } from '../validation'

type QuestionDetailsNoteFormProps = {
  defaultText: string
  isSaving: boolean
  onSave: (text: string) => Promise<{ readonly note: QuestionNote | null }>
  onDone: () => void
}

export const QuestionDetailsNoteForm: React.FC<QuestionDetailsNoteFormProps> = ({
  defaultText,
  isSaving,
  onSave,
  onDone,
}) => {
  const fieldId = useId()

  const form = useForm({
    defaultValues: { text: defaultText },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(questionNoteFormSchema) },
    onSubmit: ({ value }) =>
      toast
        .promise(onSave(value.text), {
          loading: { title: 'Zapisywanie notatki...' },
          success: result => ({
            title: result.note === null ? 'Notatka została usunięta.' : 'Notatka została zapisana.',
          }),
          error: () => ({ title: 'Nie udało się zapisać notatki. Spróbuj ponownie.' }),
        })
        .then(onDone, () => undefined),
  })

  const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    void form.handleSubmit()
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4"
      noValidate
    >
      <form.Field name="text">
        {field => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={fieldId}>Treść notatki</FieldLabel>
              <Textarea
                id={fieldId}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={event => field.handleChange(event.target.value)}
                aria-invalid={isInvalid}
                disabled={isSaving}
              />
              {isInvalid && <FieldError>{field.state.meta.errors[0]?.message}</FieldError>}
            </Field>
          )
        }}
      </form.Field>
      <Button
        type="submit"
        disabled={isSaving}
      >
        {isSaving && <LoaderCircle className="animate-spin" />}
        Zapisz notatkę
      </Button>
    </form>
  )
}
