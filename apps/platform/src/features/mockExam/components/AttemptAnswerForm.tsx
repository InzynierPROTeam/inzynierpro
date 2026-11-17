import type { AttemptQuestion } from '@inzpro/api-contracts/modules/mock-exams/responses'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import { AttemptQuestionPosition } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import {
  AnswerOption,
  AnswerOptionIndicator,
  AnswerOptionText,
} from '@inzpro/ui/components/answer-option'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldDescription, FieldError, FieldTitle } from '@inzpro/ui/components/field'
import { RadioGroup } from '@inzpro/ui/components/radio-group'
import { withAnswerLetters } from '@inzpro/utils/answer'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Schema } from 'effect'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useSaveAttemptAnswer } from '../hooks/useSaveAttemptAnswer'
import { attemptQuestionRouteApi } from '../utils'

const answerSchema = Schema.Struct({
  answerId: QuestionAnswerId.annotate({ message: 'Wybierz odpowiedź.' }),
})

const answerLabelId = 'attempt-answer-label'

type AttemptAnswerFormProps = { question: AttemptQuestion }

export const AttemptAnswerForm: React.FC<AttemptAnswerFormProps> = ({ question }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptQuestionRouteApi.useParams()
  const navigate = useNavigate()

  const submission = useSaveAttemptAnswer(user.id, {
    qualificationPathId: selectedPath.id,
    attemptId,
  })

  const { data: attempt } = useQuery(
    mockExamAttemptQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, attemptId },
    }),
  )

  const nextPosition =
    attempt !== undefined && attempt !== null && question.position < attempt.questionCount
      ? AttemptQuestionPosition.make(question.position + 1)
      : null

  const form = useForm({
    defaultValues: { answerId: question.selectedAnswerId ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(answerSchema) },
    onSubmit: ({ value }) => {
      submission.mutate({
        params: { qualificationPathId: selectedPath.id, attemptId, position: question.position },
        payload: {
          answerId: QuestionAnswerId.make(value.answerId),
          expectedVersion: question.version,
        },
      })

      if (nextPosition !== null) {
        void navigate({
          to: '/egzamin-probny/podejscie/$attemptId/$questionNumber',
          params: { attemptId, questionNumber: nextPosition },
          resetScroll: false,
          replace: true,
        })
      }
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
                disabled={question.isWithdrawn}
                className="@container flex flex-col gap-4"
              >
                {withAnswerLetters(question.answers).map(([answer, letter]) => (
                  <AnswerOption
                    key={answer.id}
                    value={answer.id}
                    tone={answer.id === question.selectedAnswerId ? 'saved' : 'neutral'}
                  >
                    <AnswerOptionIndicator>{letter}</AnswerOptionIndicator>
                    <AnswerOptionText>{answer.text}</AnswerOptionText>
                  </AnswerOption>
                ))}
              </RadioGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
              {question.isWithdrawn && (
                <FieldDescription>
                  To pytanie zostało wycofane i nie można już na nie odpowiedzieć.
                </FieldDescription>
              )}
            </Field>
          )
        }}
      </form.Field>
      {!question.isWithdrawn && (
        <form.Subscribe selector={state => state.values.answerId === question.selectedAnswerId}>
          {isSaved =>
            isSaved ? (
              nextPosition !== null && (
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      to="/egzamin-probny/podejscie/$attemptId/$questionNumber"
                      params={{ attemptId, questionNumber: nextPosition }}
                      resetScroll={false}
                      replace
                    />
                  }
                  className="self-start"
                >
                  Następne pytanie
                </Button>
              )
            ) : (
              <Button
                type="submit"
                className="self-start"
              >
                Zapisz odpowiedź
              </Button>
            )
          }
        </form.Subscribe>
      )}
    </form>
  )
}
