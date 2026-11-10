import type { SessionPreview } from '@inzpro/api-contracts/modules/study/responses'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { Schema } from 'effect'

export const PreviewSettings = ({ settings }: { settings: SessionPreview['settings'] }) => {
  const form = useForm({
    defaultValues: {
      questionCount: Schema.encodeSync(QuestionCount)(settings.defaultQuestionCount),
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: Schema.toStandardSchemaV1(
        Schema.Struct({
          questionCount: Schema.Int.check(
            Schema.makeFilter<number>(
              value =>
                value >= settings.minimumQuestionCount && value <= settings.maximumQuestionCount,
            ),
          ),
        }),
      ),
    },
  })

  return (
    <form.Field name="questionCount">
      {field => (
        <div className="space-y-2">
          <p>Liczba pytań: {field.state.value}</p>
          {settings.canChangeQuestionCount && (
            <label className="flex flex-col gap-2">
              Wybierz liczbę pytań
              <select
                className="bg-background rounded-md border p-2"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={event => field.handleChange(Number(event.target.value))}
              >
                {Array.from(
                  { length: settings.maximumQuestionCount - settings.minimumQuestionCount + 1 },
                  (_, index) => settings.minimumQuestionCount + index,
                ).map(count => (
                  <option
                    key={count}
                    value={count}
                  >
                    {count}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </form.Field>
  )
}
