import type { ChangeDailyPlanSettingsError } from '@inzpro/api-client/modules/written-study'
import type { ChangeDailyPlanSettingsPayload } from '@inzpro/api-contracts/modules/daily-plan/requests'
import type {
  DailyPlan,
  DailyPlanSettings,
} from '@inzpro/api-contracts/modules/daily-plan/responses'
import { POLAND_TIME_ZONE } from '@inzpro/config/localization'
import { UtcIsoDateTime } from '@inzpro/domain/common/date-time'
import {
  dailyCountPlanPreference,
  DailyQuestionCount,
  defaultPlanPreference,
  maxDailyQuestionCount,
  targetDatePlanPreference,
} from '@inzpro/domain/modules/daily-plan/daily-plan'
import { Button } from '@inzpro/ui/components/button'
import { DatePicker } from '@inzpro/ui/components/date-picker'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@inzpro/ui/components/dialog'
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '@inzpro/ui/components/field'
import { RadioGroup, RadioGroupItem } from '@inzpro/ui/components/radio-group'
import { Slider } from '@inzpro/ui/components/slider'
import { toast } from '@inzpro/ui/components/toast'
import {
  addWarsawDays,
  formatDate,
  getCurrentDate,
  pickedDayToUtcIsoDateTime,
  toPickerDate,
} from '@inzpro/utils/date'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Predicate, Schema } from 'effect'
import { constVoid } from 'effect/Function'
import type React from 'react'
import { useState } from 'react'

import { PlanSettingsValues } from '../validation'

type DailyPlanSettingsDialogProps = {
  settings: DailyPlanSettings
  examDate: UtcIsoDateTime | null
  save: (payload: ChangeDailyPlanSettingsPayload) => Promise<DailyPlan>
}

const settingsErrorMessage = (error: ChangeDailyPlanSettingsError | Error) =>
  Predicate.isTagged(error, 'DailyPlanSettingsConflict')
    ? 'Ustawienia planu zmieniły się w międzyczasie. Sprawdź je i zapisz ponownie.'
    : Predicate.isTagged(error, 'InvalidDailyPlanSettings')
      ? 'Wybierz dzień od dziś do dnia przed egzaminem.'
      : 'Nie udało się zapisać ustawień planu. Spróbuj ponownie.'

const currentSettingsDescription = ({ preference }: DailyPlanSettings) => {
  switch (preference.mode) {
    case defaultPlanPreference:
      return 'Plan domyślny: materiał kończysz tydzień przed egzaminem.'
    case targetDatePlanPreference:
      return `Własny termin: materiał kończysz ${formatDate(preference.targetDate)}.`
    case dailyCountPlanPreference:
      return `Stała liczba pytań: ${preference.dailyQuestionCount} dziennie.`
  }
}

export const DailyPlanSettingsDialog: React.FC<DailyPlanSettingsDialogProps> = props => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="self-start"
          />
        }
      >
        Zmień plan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ustawienia planu</DialogTitle>
          <DialogDescription>{currentSettingsDescription(props.settings)}</DialogDescription>
        </DialogHeader>
        <DailyPlanSettingsForm
          key={props.settings.version}
          {...props}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type DailyPlanSettingsFormProps = DailyPlanSettingsDialogProps & { onSaved: () => void }

const defaultDailyQuestionCount = DailyQuestionCount.make(20)

const DailyPlanSettingsForm: React.FC<DailyPlanSettingsFormProps> = ({
  settings,
  examDate,
  save,
  onSaved,
}) => {
  const { preference, version } = settings

  const submit = (payload: ChangeDailyPlanSettingsPayload['preference']) =>
    toast
      .promise(save({ preference: payload, expectedVersion: version }), {
        loading: { title: 'Zapisywanie planu…' },
        success: { title: 'Plan został zaktualizowany.' },
        error: (error: ChangeDailyPlanSettingsError | Error) => ({
          title: settingsErrorMessage(error),
        }),
      })
      .then(onSaved, constVoid)

  const defaultValues: typeof PlanSettingsValues.Encoded = {
    mode:
      preference.mode === dailyCountPlanPreference
        ? dailyCountPlanPreference
        : targetDatePlanPreference,
    targetDate: preference.mode === targetDatePlanPreference ? preference.targetDate : '',
    dailyQuestionCount:
      preference.mode === dailyCountPlanPreference
        ? preference.dailyQuestionCount
        : defaultDailyQuestionCount,
  }

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(PlanSettingsValues) },
    onSubmit: ({ value }) => {
      const { mode, targetDate, dailyQuestionCount } = Schema.decodeSync(PlanSettingsValues)(value)

      return submit(
        mode === targetDatePlanPreference
          ? { mode, targetDate: UtcIsoDateTime.make(targetDate) }
          : { mode, dailyQuestionCount },
      )
    },
  })

  const restoreDefault = () => submit({ mode: defaultPlanPreference })

  const today = toPickerDate(getCurrentDate())
  const lastDay = examDate === null ? null : toPickerDate(addWarsawDays(examDate, -1))

  return (
    <form
      className="flex flex-col gap-6"
      noValidate
      onSubmit={event => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="mode">
        {modeField => (
          <FieldSet>
            <FieldLegend variant="label">Jak chcesz planować naukę?</FieldLegend>
            <RadioGroup
              value={modeField.state.value}
              onValueChange={value =>
                modeField.handleChange(
                  value === dailyCountPlanPreference
                    ? dailyCountPlanPreference
                    : targetDatePlanPreference,
                )
              }
            >
              <Field orientation="horizontal">
                <RadioGroupItem
                  id="plan-mode-target-date"
                  value={targetDatePlanPreference}
                />
                <FieldContent>
                  <FieldLabel htmlFor="plan-mode-target-date">Własny termin zakończenia</FieldLabel>
                  {modeField.state.value === targetDatePlanPreference && (
                    <form.Field name="targetDate">
                      {field => {
                        const invalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={invalid}>
                            <DatePicker
                              aria-label="Dzień zakończenia przygotowań"
                              placeholder="Wybierz dzień"
                              invalid={invalid}
                              timeZone={POLAND_TIME_ZONE}
                              value={
                                field.state.value === '' ? null : toPickerDate(field.state.value)
                              }
                              onChange={date => field.handleChange(pickedDayToUtcIsoDateTime(date))}
                              onBlur={field.handleBlur}
                              startMonth={today}
                              endMonth={lastDay ?? undefined}
                              disabled={
                                lastDay === null
                                  ? { before: today }
                                  : [{ before: today }, { after: lastDay }]
                              }
                            />
                            {invalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>
                  )}
                </FieldContent>
              </Field>
              <Field orientation="horizontal">
                <RadioGroupItem
                  id="plan-mode-daily-count"
                  value={dailyCountPlanPreference}
                />
                <FieldContent>
                  <FieldLabel htmlFor="plan-mode-daily-count">
                    Stała liczba pytań dziennie
                  </FieldLabel>
                  {modeField.state.value === dailyCountPlanPreference && (
                    <form.Field name="dailyQuestionCount">
                      {field => {
                        const invalid = field.state.meta.isTouched && !field.state.meta.isValid

                        return (
                          <Field data-invalid={invalid}>
                            <output className="text-muted-foreground self-end text-sm">
                              {field.state.value} dziennie
                            </output>
                            <Slider
                              aria-label="Liczba pytań dziennie"
                              value={[field.state.value]}
                              min={1}
                              max={maxDailyQuestionCount}
                              step={1}
                              onValueChange={value =>
                                field.handleChange(
                                  DailyQuestionCount.make(
                                    Schema.is(Schema.Finite)(value) ? value : (value[0] ?? 1),
                                  ),
                                )
                              }
                              onBlur={field.handleBlur}
                            />
                            <div className="text-muted-foreground flex justify-between text-xs">
                              <span>1</span>
                              <span>{maxDailyQuestionCount}</span>
                            </div>
                            {invalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>
                  )}
                </FieldContent>
              </Field>
            </RadioGroup>
          </FieldSet>
        )}
      </form.Field>
      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          disabled={preference.mode === defaultPlanPreference}
          onClick={restoreDefault}
        >
          Przywróć domyślny
        </Button>
        <DialogClose
          render={
            <Button
              type="button"
              variant="outline"
            />
          }
        >
          Anuluj
        </DialogClose>
        <Button type="submit">Zapisz</Button>
      </DialogFooter>
    </form>
  )
}
