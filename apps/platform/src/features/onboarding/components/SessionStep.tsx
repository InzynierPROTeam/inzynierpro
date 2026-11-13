import { ExamSessionId } from '@inzpro/domain/modules/exam-calendar/exam-session'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@inzpro/ui/components/field'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Option, Schema } from 'effect'
import type React from 'react'

import { SessionStepValues } from '../validation'
import { ChoiceGrid } from './ChoiceGrid'
import { SessionChoices } from './SessionChoices'
import { StepFooter } from './StepFooter'
import { StepHeader } from './StepHeader'

export type SessionStepSubmit = (
  onConfirm: (value: SessionStepValues) => Promise<void>,
) => Promise<void>

type SessionStepProps = {
  initialSessionId: ExamSessionId | undefined
  specializationId: SpecializationId
  onBack: () => void
  submitButton: (submit: SessionStepSubmit, sessionId: ExamSessionId | undefined) => React.ReactNode
}

export const SessionStep: React.FC<SessionStepProps> = ({
  initialSessionId,
  specializationId,
  onBack,
  submitButton,
}) => {
  const form = useForm({
    defaultValues: { examSessionId: initialSessionId ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(SessionStepValues) },
  })

  const submit: SessionStepSubmit = async onConfirm => {
    await form.handleSubmit()

    if (!form.state.isValid) {
      return
    }

    await onConfirm(Schema.decodeSync(SessionStepValues)(form.state.values))
  }

  return (
    <form
      className="flex flex-col gap-12"
      noValidate
      onSubmit={event => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <StepHeader
        step={5}
        onBack={onBack}
      />

      <form.Field name="examSessionId">
        {field => {
          const invalid = field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <>
              <FieldGroup>
                <Field
                  data-invalid={invalid}
                  className="gap-12"
                >
                  <div className="-mt-6 flex flex-col items-center gap-2 text-center text-balance">
                    <FieldLabel
                      id={`${field.name}-label`}
                      className="text-2xl font-semibold max-sm:text-xl"
                    >
                      Wybierz sesję
                    </FieldLabel>
                    <FieldDescription id={`${field.name}-description`}>
                      Kiedy zdajesz Twój egzamin?
                    </FieldDescription>
                  </div>
                  <ChoiceGrid
                    name={field.name}
                    value={field.state.value}
                    onChange={field.handleChange}
                    onBlur={field.handleBlur}
                    invalid={invalid}
                    labelId={`${field.name}-label`}
                  >
                    <SessionChoices specializationId={specializationId} />
                  </ChoiceGrid>

                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              </FieldGroup>
              <StepFooter>
                {submitButton(
                  submit,
                  Schema.decodeOption(ExamSessionId)(field.state.value).pipe(Option.getOrUndefined),
                )}
              </StepFooter>
            </>
          )
        }}
      </form.Field>
    </form>
  )
}
