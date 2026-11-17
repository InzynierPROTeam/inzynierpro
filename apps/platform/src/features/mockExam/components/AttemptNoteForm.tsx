import type { AttemptReviewQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldError, FieldLabel } from '@inzpro/ui/components/field'
import { Textarea } from '@inzpro/ui/components/textarea'
import { toast } from '@inzpro/ui/components/toast'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import type React from 'react'
import { useId } from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { questionNoteFormSchema } from '~platform/features/questionNotes/validation'

import { useSaveAttemptNote } from '../hooks/useSaveAttemptNote'

type AttemptNoteFormProps = { question: AttemptReviewQuestion; onDone: () => void }

export const AttemptNoteForm: React.FC<AttemptNoteFormProps> = ({ question, onDone }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useSaveAttemptNote(user.id, selectedPath.id)
  const fieldId = useId()

  const form = useForm({
    defaultValues: { text: question.note?.text ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(questionNoteFormSchema) },
    onSubmit: ({ value }) =>
      toast
        .promise(mutation.mutateAsync({ questionId: question.questionId, text: value.text }), {
          loading: { title: 'Zapisywanie notatki…' },
          success: { title: 'Notatka zapisana.' },
          error: () => ({ title: 'Nie udało się zapisać notatki.' }),
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
        {field => (
          <Field>
            <FieldLabel htmlFor={fieldId}>Treść notatki</FieldLabel>
            <Textarea
              id={fieldId}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={event => field.handleChange(event.target.value)}
              aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
            />
            <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
          </Field>
        )}
      </form.Field>
      <Button
        type="submit"
        disabled={mutation.isPending}
      >
        Zapisz notatkę
      </Button>
    </form>
  )
}
