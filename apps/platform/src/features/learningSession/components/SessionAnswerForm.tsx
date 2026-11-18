import type {
  SessionAnswer,
  SessionQuestion,
} from '@inzpro/api-contracts/modules/written-study/responses'
import { QuestionAnswerId } from '@inzpro/domain/modules/learning-content/question-answer'
import { endedStudySession } from '@inzpro/domain/modules/learning/study-session'
import { sessionQueryOptions } from '@inzpro/queries/modules/written-study/queries'
import {
  AnswerOption,
  AnswerOptionIndicator,
  AnswerOptionText,
  type AnswerOptionTone,
} from '@inzpro/ui/components/answer-option'
import { Field, FieldError, FieldTitle } from '@inzpro/ui/components/field'
import { RadioGroup } from '@inzpro/ui/components/radio-group'
import { withAnswerLetters } from '@inzpro/utils/answer'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Match, Schema } from 'effect'
import { CheckIcon, XIcon } from 'lucide-react'
import type React from 'react'
import { sessionWithdrawalNotice } from '~platform/features/learningSession/utils/session'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { useSubmitSessionAnswer } from '../hooks/useSubmitSessionAnswer'
import { SessionAnswerActions } from './SessionAnswerActions'
import { SessionAnswerExplanation } from './SessionAnswerExplanation'
import { RemainingQuestionsWithdrawn, SessionQuestionWithdrawn } from './SessionQuestionWithdrawn'

const answerSchema = Schema.Struct({
  answerId: QuestionAnswerId.annotate({ message: 'Wybierz odpowiedź.' }),
})

type AnswerSchema = typeof answerSchema.Encoded

const noSelection: AnswerSchema = { answerId: '' }

const answerLabelId = 'session-answer-label'

const answerTone = (
  answer: SessionQuestion['answers'][number],
  submitted: SessionAnswer | null,
): AnswerOptionTone =>
  submitted === null
    ? 'neutral'
    : answer.isCorrect
      ? 'correct'
      : answer.id === submitted.answerId
        ? 'incorrect'
        : 'neutral'

type SessionAnswerFormProps = { question: SessionQuestion }

export const SessionAnswerForm: React.FC<SessionAnswerFormProps> = ({ question }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const submission = useSubmitSessionAnswer(user.id)

  const params = {
    qualificationPathId: selectedPath.id,
    sessionId: question.sessionId,
    position: question.position,
  }

  const form = useForm({
    defaultValues: noSelection,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(answerSchema) },
    onSubmit: ({ value }) =>
      submission.mutate({
        params,
        payload: {
          questionRevisionId: question.questionRevisionId,
          answerId: QuestionAnswerId.make(value.answerId),
        },
      }),
  })

  const submitted = question.answer

  const { data: session } = useQuery(
    sessionQueryOptions(apiHttpClient, user.id, {
      params: { qualificationPathId: selectedPath.id, sessionId: question.sessionId },
    }),
  )

  const isClosed =
    submitted !== null || question.isWithdrawn || session?.status === endedStudySession

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
                value={submitted?.answerId ?? field.state.value}
                onValueChange={(value: string) => field.handleChange(value)}
                disabled={isClosed}
                className="@container flex flex-col gap-4"
              >
                {withAnswerLetters(question.answers).map(([answer, letter]) => {
                  const tone = answerTone(answer, submitted)

                  return (
                    <AnswerOption
                      key={answer.id}
                      value={answer.id}
                      tone={tone}
                    >
                      <AnswerOptionIndicator>
                        {Match.value(tone).pipe(
                          Match.when('correct', () => <CheckIcon aria-hidden />),
                          Match.when('incorrect', () => <XIcon aria-hidden />),
                          Match.orElse(() => letter),
                        )}
                      </AnswerOptionIndicator>
                      <AnswerOptionText>{answer.text}</AnswerOptionText>
                    </AnswerOption>
                  )
                })}
              </RadioGroup>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {submission.isSuccess && submission.data.awardedXp > 0 && (
        <p
          role="status"
          className="text-muted-foreground text-sm"
        >
          +{submission.data.awardedXp} XP
        </p>
      )}
      {submitted !== null && <SessionAnswerExplanation explanation={question.explanation} />}

      {Match.value(sessionWithdrawalNotice(question, session)).pipe(
        Match.when('question', () => <SessionQuestionWithdrawn />),
        Match.when('remaining', () => <RemainingQuestionsWithdrawn />),
        Match.orElse(() => null),
      )}

      <SessionAnswerActions
        question={question}
        isClosed={isClosed}
        isSubmitting={submission.isPending}
      />
    </form>
  )
}
