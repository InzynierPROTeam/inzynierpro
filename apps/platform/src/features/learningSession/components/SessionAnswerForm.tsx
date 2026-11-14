import type { SessionQuestion } from '@inzpro/api-contracts/modules/study/responses'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import {
  AnswerOption,
  AnswerOptionIndicator,
  AnswerOptionSkeleton,
  AnswerOptionText,
} from '@inzpro/ui/components/answer-option'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldError, FieldTitle } from '@inzpro/ui/components/field'
import { RadioGroup } from '@inzpro/ui/components/radio-group'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { withAnswerLetters } from '@inzpro/utils/answer'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import type React from 'react'

const answerSchema = Schema.Struct({
  answerId: QuestionAnswerId.annotate({ message: 'Wybierz odpowiedź.' }),
})

type AnswerSchema = typeof answerSchema.Encoded

// No answer is selected until the user picks one; the schema rejects the empty value.
const noSelection: AnswerSchema = { answerId: '' }

const answerLabelId = 'session-answer-label'

type SessionAnswerFormProps = { answers: SessionQuestion['answers'] }

export const SessionAnswerForm: React.FC<SessionAnswerFormProps> = ({ answers }) => {
  const form = useForm({
    defaultValues: noSelection,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(answerSchema) },
    onSubmit: ({ value }) => {
      const answer = answers.find(({ id }) => id === value.answerId)

      // TODO(#8): Record the attempt and reveal the correct answer instead of an alert.
      window.alert(`Wybrana odpowiedź: ${answer?.text ?? value.answerId}`)
    },
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
                // Options keep the order stored when the session started; letters follow that order.
                className="@container flex flex-col gap-4"
              >
                {withAnswerLetters(answers).map(([answer, letter]) => (
                  <AnswerOption
                    key={answer.id}
                    value={answer.id}
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
      <Button type="submit">Sprawdź</Button>
    </form>
  )
}

export const SessionAnswerFormSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-col gap-3">
      <TextSkeleton
        size="sm"
        className="w-32"
      />
      <div className="@container flex flex-col gap-4">
        <AnswerOptionSkeleton textClassName="max-w-24" />
        <AnswerOptionSkeleton textClassName="max-w-40" />
        <AnswerOptionSkeleton textClassName="max-w-32" />
      </div>
    </div>
    <Button disabled>Sprawdź</Button>
  </div>
)
