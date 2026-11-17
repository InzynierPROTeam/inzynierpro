import type { AttemptQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  AnswerOption,
  AnswerOptionIndicator,
  AnswerOptionText,
} from '@inzpro/ui/components/answer-option'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldError, FieldTitle } from '@inzpro/ui/components/field'
import { RadioGroup } from '@inzpro/ui/components/radio-group'
import { toast } from '@inzpro/ui/components/toast'
import { withAnswerLetters } from '@inzpro/utils/answer'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import type React from 'react'

const answerSchema = Schema.Struct({
  answerId: QuestionAnswerId.annotate({ message: 'Wybierz odpowiedź.' }),
})

type AnswerSchema = typeof answerSchema.Encoded

const noSelection: AnswerSchema = { answerId: '' }

const answerLabelId = 'attempt-answer-label'

type AttemptAnswerFormProps = { question: AttemptQuestion }

export const AttemptAnswerForm: React.FC<AttemptAnswerFormProps> = ({ question }) => {
  const form = useForm({
    defaultValues: noSelection,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(answerSchema) },
    onSubmit: () =>
      // TODO(#76): Save the selected answer instead of only acknowledging it.
      toast.add({ type: 'info', title: `Zaznaczono odpowiedź na pytanie ${question.position}.` }),
  })

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={event => {
        event.preventDefault()
        event.stopPropagation()

        void form.handleSubmit()
      }}
      noValidate
    >
      <form.Field name="answerId">
        {field => {
          const isInvalid = !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldTitle id={answerLabelId}>Wybierz odpowiedź</FieldTitle>
              <RadioGroup
                aria-labelledby={answerLabelId}
                aria-invalid={isInvalid}
                value={field.state.value}
                onValueChange={(value: string) => field.handleChange(value)}
                disabled={question.isWithdrawn}
                className="@container flex flex-col gap-4"
              >
                {withAnswerLetters(question.answers).map(([answer, letter]) => (
                  <AnswerOption
                    key={answer.id}
                    value={answer.id}
                    tone="neutral"
                  >
                    <AnswerOptionIndicator>{letter}</AnswerOptionIndicator>
                    <AnswerOptionText>{answer.text}</AnswerOptionText>
                  </AnswerOption>
                ))}
              </RadioGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>
      <Button
        type="submit"
        disabled={question.isWithdrawn}
        className="self-start"
      >
        Zapisz odpowiedź
      </Button>
    </form>
  )
}
