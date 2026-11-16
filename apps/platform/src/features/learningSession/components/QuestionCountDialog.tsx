import type { SessionCountSettings } from '@inzpro/api-contracts/modules/study/responses'
import { Button } from '@inzpro/ui/components/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@inzpro/ui/components/dialog'
import { Slider } from '@inzpro/ui/components/slider'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'
import type React from 'react'
import { useState } from 'react'

type QuestionCountDialogProps = {
  settings: SessionCountSettings
  count: number
  // Stores the chosen count, usually in the preview's search params.
  onCountChange: (count: number) => Promise<void>
}

export const QuestionCountDialog: React.FC<QuestionCountDialogProps> = ({
  settings,
  count,
  onCountChange,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        render={
          <Button
            variant="link"
            size="sm"
          />
        }
      >
        Zmień
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liczba pytań w sesji</DialogTitle>
          <DialogDescription>
            Przeciągnij suwak, aby ustawić limit lub zostaw maksymalną liczbę.
          </DialogDescription>
        </DialogHeader>
        <QuestionCountForm
          key={count}
          settings={settings}
          count={count}
          onCountChange={onCountChange}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type QuestionCountFormProps = QuestionCountDialogProps & { onSaved: () => void }

const QuestionCountForm: React.FC<QuestionCountFormProps> = ({
  settings,
  count,
  onCountChange,
  onSaved,
}) => {
  const form = useForm({
    defaultValues: { count },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: Schema.toStandardSchemaV1(
        Schema.Struct({
          count: Schema.Int.check(
            Schema.isBetween({
              minimum: settings.minimumQuestionCount,
              maximum: settings.maximumQuestionCount,
            }),
          ),
        }),
      ),
    },
    onSubmit: async ({ value }) => {
      await onCountChange(value.count)
      onSaved()
    },
  })

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={event => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <form.Field name="count">
        {field => (
          <div className="flex flex-col gap-3">
            <output className="text-muted-foreground self-end text-sm">
              Wybrano {field.state.value}
            </output>
            <Slider
              aria-label="Liczba pytań w sesji"
              value={[field.state.value]}
              min={settings.minimumQuestionCount}
              max={settings.maximumQuestionCount}
              step={1}
              onValueChange={value =>
                field.handleChange(
                  Schema.is(Schema.Finite)(value)
                    ? value
                    : (value[0] ?? settings.minimumQuestionCount),
                )
              }
              onBlur={field.handleBlur}
            />
            <div className="text-muted-foreground flex justify-between text-xs">
              <span>{settings.minimumQuestionCount}</span>
              <span>{settings.maximumQuestionCount}</span>
            </div>
          </div>
        )}
      </form.Field>
      <DialogFooter>
        <DialogClose
          render={
            <Button
              type="button"
              variant="outline"
            />
          }
        >
          Zamknij
        </DialogClose>
        <Button type="submit">Zapisz</Button>
      </DialogFooter>
    </form>
  )
}
