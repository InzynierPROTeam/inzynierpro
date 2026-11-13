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

import { SpecializationStepValues } from '../validation'
import { ChoiceGrid } from './ChoiceGrid'
import { PrefetchQualificationKinds } from './PrefetchQualificationKinds'
import { SpecializationChoices } from './SpecializationChoices'
import { StepFooter } from './StepFooter'
import { StepHeader } from './StepHeader'

type SpecializationStepProps = {
  initialValue: SpecializationId | undefined
  onNext: (value: SpecializationId) => Promise<void>
}

export const SpecializationStep: React.FC<SpecializationStepProps> = ({ initialValue, onNext }) => {
  const form = useForm({
    defaultValues: { specializationId: initialValue ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(SpecializationStepValues) },
    onSubmit: async ({ value }) => {
      const selected = Schema.decodeSync(SpecializationStepValues)(value)
      await onNext(selected.specializationId)
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
      <StepHeader step={1} />

      <FieldGroup>
        <form.Field name="specializationId">
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
                    Wybierz specjalność
                  </FieldLabel>
                  <FieldDescription id={`${field.name}-description`}>
                    Na początek wybierz specjalność, którą będziesz mieć na egzaminie.
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
                  <SpecializationChoices />
                </ChoiceGrid>
                <PrefetchQualificationKinds value={field.state.value} />
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
