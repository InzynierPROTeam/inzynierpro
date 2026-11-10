import { ChangeGoalPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import type { UserQualificationPath } from '@inzpro/domain/modules/preparation/user-qualification-path'
import { goalOptionsQueryOptions, preparationKeys } from '@inzpro/queries/modules/preparation'
import { studyKeys } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { useForm, revalidateLogic } from '@tanstack/react-form'
import { useInfiniteQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Schema } from 'effect'
import { toast } from 'sonner'
import { apiHttpClient } from '~platform/lib/api-client'
import { dateTimeInputToUtc, formatDateTimeInput } from '~platform/utils/date-time-input'

import { saveGoal } from '../actions'
import { GoalFormValues } from '../validation'

export const GoalSettings = ({ path, userId }: { path: UserQualificationPath; userId: UserId }) => {
  const options = useInfiniteQuery(
    goalOptionsQueryOptions(apiHttpClient, userId, {
      query: {},
      params: { qualificationPathId: path.id },
    }),
  )

  const client = useQueryClient()

  const mutation = useMutation({
    mutationFn: saveGoal,
  })

  const form = useForm({
    defaultValues: {
      examSessionId: Schema.encodeSync(ChangeGoalPayload.fields.examSessionId)(
        path.goal.examSessionId,
      ),
      oralExamDate: formatDateTimeInput(path.goal.oralExamDate),
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(GoalFormValues) },
    onSubmit: async ({ value }) => {
      toast.promise(
        async () => {
          const payload = Schema.decodeUnknownSync(ChangeGoalPayload)({
            ...value,
            oralExamDate: dateTimeInputToUtc(value.oralExamDate),
            expectedVersion: path.goal.version,
          })

          await mutation.mutateAsync({ params: { qualificationPathId: path.id }, payload })
          await Promise.all([
            client.invalidateQueries({ queryKey: preparationKeys.paths(userId) }),
            client.invalidateQueries({ queryKey: preparationKeys.selection(userId) }),
            client.invalidateQueries({ queryKey: preparationKeys.path(userId, path.id) }),
            client.invalidateQueries({ queryKey: studyKeys.path(userId, path.id) }),
          ])
        },
        {
          loading: 'Zapisywanie celu…',
          success: 'Cel został zapisany.',
          error:
            'Nie udało się zapisać celu. Odśwież dane, jeśli został zmieniony na innym urządzeniu.',
        },
      )
    },
  })

  return (
    <details>
      <summary>Zmień cel przygotowań</summary>
      <form
        className="mt-4 space-y-4"
        onSubmit={event => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field name="examSessionId">
          {field => (
            <label className="flex flex-col gap-2">
              Sesja docelowa
              <select
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={event =>
                  field.handleChange(
                    Schema.decodeUnknownSync(ChangeGoalPayload.fields.examSessionId)(
                      event.target.value,
                    ),
                  )
                }
              >
                <option value={path.goal.examSessionId}>{path.goal.sessionName} (obecna)</option>
                {options.data?.pages
                  .flatMap(page => page.data)
                  .filter(session => session.id !== path.goal.examSessionId)
                  .map(session => (
                    <option
                      key={session.id}
                      value={session.id}
                    >
                      {session.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </form.Field>
        {path.accessScope !== 'written' && (
          <form.Field name="oralExamDate">
            {field => (
              <label className="flex flex-col gap-2">
                Twój termin egzaminu ustnego
                <input
                  type="datetime-local"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={event => field.handleChange(event.target.value)}
                />
              </label>
            )}
          </form.Field>
        )}
        {options.hasNextPage && (
          <Button
            type="button"
            disabled={options.isFetchingNextPage}
            onClick={() => {
              void options.fetchNextPage()
            }}
          >
            Wczytaj więcej sesji
          </Button>
        )}
        <p>
          Jeśli nie podasz własnej daty, cel uwzględni orientacyjny termin egzaminu ustnego w tej
          sesji.
        </p>
        {options.isPending && <p role="status">Wczytywanie sesji egzaminacyjnych…</p>}
        {options.isError && (
          <p role="alert">
            Nie udało się wczytać dostępnych sesji.{' '}
            <button
              type="button"
              onClick={() => {
                void options.refetch()
              }}
            >
              Spróbuj ponownie
            </button>
          </p>
        )}
        {mutation.isError && (
          <p role="alert">
            Zmiany nie zostały zapisane. Wczytaj aktualny cel przed ponowną próbą.
            <button
              type="button"
              onClick={() => {
                void client.invalidateQueries({ queryKey: preparationKeys.paths(userId) })
                void client.invalidateQueries({ queryKey: preparationKeys.selection(userId) })
              }}
            >
              Wczytaj aktualny cel
            </button>
          </p>
        )}
        <Button
          type="submit"
          disabled={mutation.isPending}
        >
          Zapisz cel
        </Button>
      </form>
    </details>
  )
}
