import type { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
import type { QualificationScopeId } from '@inzpro/domain/modules/qualification-paths/qualification-scope'
import type { SpecializationId } from '@inzpro/domain/modules/qualification-paths/specialization'
import { Button } from '@inzpro/ui/components/button'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@inzpro/ui/components/field'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import type React from 'react'

import { ScopeStepValues } from '../validation'
import { ChoiceGrid } from './ChoiceGrid'
import { ScopeChoices } from './ScopeChoices'
import { StepFooter } from './StepFooter'
import { StepHeader } from './StepHeader'

type ScopeStepProps = {
  initialValue: QualificationScopeId | undefined
  onNext: (value: QualificationScopeId) => Promise<void>
  specializationId: SpecializationId
  qualificationKindId: QualificationKindId
  onBack: () => void
}

export const ScopeStep: React.FC<ScopeStepProps> = ({
  initialValue,
  onNext,
  specializationId,
  qualificationKindId,
  onBack,
}) => {
  const form = useForm({
    defaultValues: { qualificationScopeId: initialValue ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(ScopeStepValues) },
    onSubmit: async ({ value }) => {
      const selected = Schema.decodeSync(ScopeStepValues)(value)
      await onNext(selected.qualificationScopeId)
    },
  })

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
        step={3}
        onBack={onBack}
      />

      <FieldGroup>
        <form.Field name="qualificationScopeId">
          {field => {
            const invalid = field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field
                data-invalid={invalid}
                className="gap-12"
              >
                <div className="-mt-6 flex flex-col items-center gap-2 text-center text-balance">
                  <FieldLabel
                    id={`${field.name}-label`}
                    className="text-2xl font-semibold max-sm:text-xl"
                  >
                    Wybierz zakres uprawnień
                  </FieldLabel>
                  <FieldDescription id={`${field.name}-description`}>
                    Wybierz zakres uprawnień, do którego chcesz się przygotować.
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
                  <ScopeChoices
                    specializationId={specializationId}
                    qualificationKindId={qualificationKindId}
                  />
                </ChoiceGrid>

                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </FieldGroup>
      <StepFooter>
        <Button type="submit">Dalej</Button>
      </StepFooter>
    </form>
  )
}
