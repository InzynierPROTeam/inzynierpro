import type { QualificationKindId } from '@inzpro/domain/modules/qualification-paths/qualification-kind'
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

import { KindStepValues } from '../validation'
import { ChoiceGrid } from './ChoiceGrid'
import { KindChoices } from './KindChoices'
import { PrefetchScopes } from './PrefetchScopes'
import { StepFooter } from './StepFooter'
import { StepHeader } from './StepHeader'

type KindStepProps = {
  initialValue: QualificationKindId | undefined
  onNext: (value: QualificationKindId) => Promise<void>
  specializationId: SpecializationId
  onBack: () => void
}

export const KindStep: React.FC<KindStepProps> = ({
  initialValue,
  onNext,
  specializationId,
  onBack,
}) => {
  const form = useForm({
    defaultValues: { qualificationKindId: initialValue ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(KindStepValues) },
    onSubmit: async ({ value }) => {
      const selected = Schema.decodeSync(KindStepValues)(value)
      await onNext(selected.qualificationKindId)
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
        step={2}
        onBack={onBack}
      />

      <FieldGroup>
        <form.Field name="qualificationKindId">
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
                    Wybierz rodzaj uprawnień
                  </FieldLabel>
                  <FieldDescription id={`${field.name}-description`}>
                    Wybierz rodzaj uprawnień, o które się ubiegasz.
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
                  <KindChoices specializationId={specializationId} />
                </ChoiceGrid>
                <PrefetchScopes
                  specializationId={specializationId}
                  value={field.state.value}
                />
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
