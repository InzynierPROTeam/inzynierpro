import type { SessionQuestion } from '@inzpro/api-contracts/modules/study/responses'
import { questionNoteMaxLength } from '@inzpro/domain/modules/study/question-note'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@inzpro/ui/components/field'
import { Textarea } from '@inzpro/ui/components/textarea'
import { toast } from '@inzpro/ui/components/toast'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import { LoaderCircle } from 'lucide-react'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useSaveQuestionNote } from '../hooks/useSaveQuestionNote'
import { questionNoteFormSchema } from '../validation'

type QuestionNoteFormProps = {
  question: SessionQuestion
  onDone: () => void
}

/** V1's `QuestionAddNotesForm`: the whole note in one field; saving a blank note clears it. */
export const QuestionNoteForm: React.FC<QuestionNoteFormProps> = ({ question, onDone }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useSaveQuestionNote(user.id, {
    params: {
      qualificationPathId: selectedPath.id,
      sessionId: question.sessionId,
      position: question.position,
    },
  })

  const form = useForm({
    onSubmit: ({ value }) =>
      toast
        .promise(mutation.mutateAsync({ questionId: question.questionId, text: value.text }), {
          loading: { title: 'Zapisywanie notatki...' },
          success: result => ({
            title: result.note === null ? 'Notatka została usunięta.' : 'Notatka została zapisana.',
          }),
          error: () => ({ title: 'Nie udało się zapisać notatki. Spróbuj ponownie.' }),
        })
        .then(onDone, () => undefined),
    defaultValues: { text: question.note?.text ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(questionNoteFormSchema) },
  })

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={e => {
        e.preventDefault()
        e.stopPropagation()

        void form.handleSubmit()
      }}
      noValidate
    >
      <form.Field name="text">
        {field => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Treść notatki</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={e => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Zapisz, co pomoże Ci zapamiętać odpowiedź..."
                disabled={mutation.isPending}
                autoFocus
              />
              <FieldDescription className="text-2xs text-right">
                {field.state.value.length}/{questionNoteMaxLength} znaków
              </FieldDescription>
              {isInvalid && <FieldError>{field.state.meta.errors[0]?.message}</FieldError>}
            </Field>
          )
        }}
      </form.Field>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {question.note !== null && (
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={onDone}
          >
            Anuluj
          </Button>
        )}
        <Button
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending && <LoaderCircle className="animate-spin" />}
          Zapisz notatkę
        </Button>
      </div>
    </form>
  )
}
