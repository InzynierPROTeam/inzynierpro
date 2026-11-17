import type { OralQuizCheck } from '@inzpro/api-contracts/modules/oral-study/responses'
import {
  allowsSeveralOptions,
  OralKnowledgeCheckOptionId,
} from '@inzpro/domain/modules/learning-content/oral-knowledge-check'
import type { OralStudySessionId } from '@inzpro/domain/modules/oral-study/oral-study-session'
import { Alert, AlertTitle } from '@inzpro/ui/components/alert'
import {
  AnswerCheckboxOption,
  AnswerOption,
  AnswerOptionIndicator,
  AnswerOptionText,
  type AnswerOptionTone,
} from '@inzpro/ui/components/answer-option'
import { Button } from '@inzpro/ui/components/button'
import { CheckboxGroup } from '@inzpro/ui/components/checkbox-group'
import { Field, FieldError, FieldTitle } from '@inzpro/ui/components/field'
import { RadioGroup } from '@inzpro/ui/components/radio-group'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Match, Schema } from 'effect'
import { CheckIcon, CircleDashed, LoaderCircle, XIcon } from 'lucide-react'
import type React from 'react'
import { SessionAnswerExplanation } from '~platform/features/learningSession/components/SessionAnswerExplanation'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useAnswerOralQuizCheck } from '../hooks/useAnswerOralQuizCheck'

const selectionSchema = Schema.Struct({
  optionIds: Schema.Array(OralKnowledgeCheckOptionId).check(
    Schema.isMinLength(1, { message: 'Wybierz odpowiedź.' }),
  ),
})

type SelectionSchema = typeof selectionSchema.Encoded

type OptionFeedback = 'none' | 'correct' | 'missed' | 'wrong'

const optionFeedback = (
  optionId: OralKnowledgeCheckOptionId,
  check: OralQuizCheck,
): OptionFeedback => {
  if (check.result === null) {
    return 'none'
  }

  const isSelected = check.result.selectedOptionIds.includes(optionId)

  if (check.result.correctOptionIds.includes(optionId)) {
    return isSelected ? 'correct' : 'missed'
  }

  return isSelected ? 'wrong' : 'none'
}

const feedbackTone = (feedback: OptionFeedback): AnswerOptionTone =>
  Match.value(feedback).pipe(
    Match.when('wrong', () => 'incorrect' as const),
    Match.when('none', () => 'neutral' as const),
    Match.orElse(() => 'correct' as const),
  )

const optionLetter = (index: number) => String.fromCharCode(65 + index)

type OralQuizCheckFormProps = { sessionId: OralStudySessionId; check: OralQuizCheck }

export const OralQuizCheckForm: React.FC<OralQuizCheckFormProps> = ({ sessionId, check }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const answer = useAnswerOralQuizCheck(user.id)

  const params = { qualificationPathId: selectedPath.id, sessionId, position: check.position }

  const defaultSelection: SelectionSchema = { optionIds: check.result?.selectedOptionIds ?? [] }

  const form = useForm({
    defaultValues: defaultSelection,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(selectionSchema) },
    onSubmit: ({ value }) =>
      answer.mutate({
        params,
        payload: { optionIds: value.optionIds.map(id => OralKnowledgeCheckOptionId.make(id)) },
      }),
  })

  const isChecked = check.result !== null
  const severalOptions = allowsSeveralOptions(check.format)
  const selectionLabelId = `oral-quiz-check-${check.position}-label`

  const options = check.options.map((option, index) => {
    const feedback = optionFeedback(option.id, check)

    return (
      <OralQuizOption
        key={option.id}
        severalOptions={severalOptions}
        value={option.id}
        tone={feedbackTone(feedback)}
        indicator={Match.value(feedback).pipe(
          Match.when('correct', () => <CheckIcon aria-hidden />),
          Match.when('missed', () => <CircleDashed aria-hidden />),
          Match.when('wrong', () => <XIcon aria-hidden />),
          Match.orElse(() => optionLetter(index)),
        )}
      >
        {option.text}
        {feedback === 'missed' && (
          <span className="text-muted-foreground block text-xs">Pominięta poprawna odpowiedź</span>
        )}
      </OralQuizOption>
    )
  })

  return (
    <form
      aria-label={`Pytanie ${check.position}`}
      className="flex flex-col gap-6"
      onSubmit={event => {
        event.preventDefault()
        event.stopPropagation()

        void form.handleSubmit()
      }}
      noValidate
    >
      <form.Field name="optionIds">
        {field => {
          const isInvalid = !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldTitle id={selectionLabelId}>
                {severalOptions ? 'Zaznacz wszystkie poprawne odpowiedzi' : 'Wybierz odpowiedź'}
              </FieldTitle>
              {severalOptions ? (
                <CheckboxGroup
                  aria-labelledby={selectionLabelId}
                  aria-invalid={isInvalid}
                  value={[...field.state.value]}
                  onValueChange={(value: Array<string>) => field.handleChange(value)}
                  disabled={isChecked}
                  className="@container flex flex-col gap-4"
                >
                  {options}
                </CheckboxGroup>
              ) : (
                <RadioGroup
                  aria-labelledby={selectionLabelId}
                  aria-invalid={isInvalid}
                  value={field.state.value[0] ?? ''}
                  onValueChange={(value: string) => field.handleChange([value])}
                  disabled={isChecked}
                  className="@container flex flex-col gap-4"
                >
                  {options}
                </RadioGroup>
              )}
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {check.result !== null && (
        <>
          <Alert variant={check.result.isCorrect ? 'default' : 'destructive'}>
            <AlertTitle>
              {check.result.isCorrect ? 'Dobra odpowiedź' : 'Niepoprawna odpowiedź'}
            </AlertTitle>
          </Alert>
          <SessionAnswerExplanation explanation={check.result.explanation} />
        </>
      )}

      {!isChecked && (
        <Button
          type="submit"
          className="self-start"
          disabled={answer.isPending}
        >
          {answer.isPending && <LoaderCircle className="animate-spin" />}
          Sprawdź
        </Button>
      )}
    </form>
  )
}

type OralQuizOptionProps = {
  severalOptions: boolean
  value: string
  tone: AnswerOptionTone
  indicator: React.ReactNode
  children: React.ReactNode
}

const OralQuizOption: React.FC<OralQuizOptionProps> = ({
  severalOptions,
  value,
  tone,
  indicator,
  children,
}) => {
  const content = (
    <>
      <AnswerOptionIndicator>{indicator}</AnswerOptionIndicator>
      <AnswerOptionText>{children}</AnswerOptionText>
    </>
  )

  return severalOptions ? (
    <AnswerCheckboxOption
      value={value}
      tone={tone}
    >
      {content}
    </AnswerCheckboxOption>
  ) : (
    <AnswerOption
      value={value}
      tone={tone}
    >
      {content}
    </AnswerOption>
  )
}
