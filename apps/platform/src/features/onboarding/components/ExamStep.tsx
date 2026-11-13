import type { ExamAccessScope } from '@inzpro/domain/modules/preparation/exam-access'
import {
  writtenExamAccess,
  oralExamAccess,
  bothExamAccess,
} from '@inzpro/domain/modules/preparation/exam-access'
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

import { getExamTypeIcon } from '../utils/icons'
import { ExamStepValues } from '../validation'
import { ChoiceGrid } from './ChoiceGrid'
import { PrefetchExamSessions } from './PrefetchExamSessions'
import { SelectItem } from './SelectItem'
import { StepFooter } from './StepFooter'
import { StepHeader } from './StepHeader'

type ExamStepProps = {
  initialValue: ExamAccessScope | undefined
  onNext: (value: ExamAccessScope) => Promise<void>
  specializationId: SpecializationId
  onBack: () => void
}

export const ExamStep: React.FC<ExamStepProps> = ({
  initialValue,
  onNext,
  specializationId,
  onBack,
}) => {
  const form = useForm({
    defaultValues: { accessScope: initialValue ?? '' },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(ExamStepValues) },
    onSubmit: async ({ value }) => {
      const selected = Schema.decodeSync(ExamStepValues)(value)
      await onNext(selected.accessScope)
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
        step={4}
        onBack={onBack}
      />
      <PrefetchExamSessions specializationId={specializationId} />
      <FieldGroup>
        <form.Field name="accessScope">
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
                    Wybierz rodzaj egzaminu
                  </FieldLabel>
                  <FieldDescription id={`${field.name}-description`}>
                    Do której części egzaminu chcesz się przygotować?
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
                  <SelectItem
                    name="Pisemny"
                    value={writtenExamAccess}
                    icon={getExamTypeIcon(writtenExamAccess)}
                  />
                  <SelectItem
                    name="Ustny"
                    value={oralExamAccess}
                    icon={getExamTypeIcon(oralExamAccess)}
                  />
                  <SelectItem
                    name="Pisemny i ustny"
                    value={bothExamAccess}
                    icon={getExamTypeIcon(bothExamAccess)}
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
