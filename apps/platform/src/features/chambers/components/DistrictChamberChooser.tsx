import { SetDistrictChamberPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import type { UserQualificationPath } from '@inzpro/api-contracts/modules/preparation/responses'
import { PageLimit } from '@inzpro/domain/common/pagination'
import { districtChambersQueryOptions } from '@inzpro/queries/modules/exam-calendar/queries'
import { Button } from '@inzpro/ui/components/button'
import { Field, FieldLabel, FieldDescription } from '@inzpro/ui/components/field'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@inzpro/ui/components/select'
import { toast } from '@inzpro/ui/components/toast'
import { revalidateLogic, useForm } from '@tanstack/react-form'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Schema } from 'effect'
import { constVoid } from 'effect/Function'
import { authenticatedRouteApi } from '~platform/features/auth/utils'
import { apiHttpClient } from '~platform/lib/api-client'

import { useSetDistrictChamber } from '../hooks/useSetDistrictChamber'

type DistrictChamberChooserProps = {
  path: UserQualificationPath
  onSaved?: () => void
}

export const DistrictChamberChooser = ({ path, onSaved }: DistrictChamberChooserProps) => {
  const { session } = authenticatedRouteApi.useRouteContext()
  const current = path.districtChamber
  const mutation = useSetDistrictChamber(session.user.id)

  const { data } = useSuspenseQuery(
    districtChambersQueryOptions(apiHttpClient, {
      query: { generalChamberId: path.generalChamberId, limit: PageLimit.make(100) },
    }),
  )

  const items = [
    { value: null, label: 'Nie wybrano izby' },
    ...data.data.map(chamber => ({ value: chamber.id, label: chamber.name })),
  ]

  const defaultValues: typeof SetDistrictChamberPayload.Encoded = {
    districtChamberId: current?.id ?? null,
  }

  const form = useForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(SetDistrictChamberPayload) },
    onSubmit: ({ value }) =>
      toast
        .promise(
          mutation.mutateAsync({
            params: { qualificationPathId: path.id },
            payload: Schema.decodeSync(SetDistrictChamberPayload)(value),
          }),
          {
            loading: { title: 'Zapisywanie izby…' },
            success: { title: 'Zapisano izbę okręgową' },
            error: { title: 'Nie udało się zapisać izby. Spróbuj ponownie.' },
          },
        )
        .then(onSaved, constVoid),
  })

  const submit = (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    void form.handleSubmit()
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4"
    >
      <form.Field name="districtChamberId">
        {field => (
          <Field>
            <FieldLabel htmlFor="district-chamber">Twoja izba okręgowa</FieldLabel>
            <Select
              items={items}
              value={field.state.value}
              onValueChange={field.handleChange}
              disabled={mutation.isPending}
            >
              <SelectTrigger
                id="district-chamber"
                className="w-full"
              >
                <SelectValue>
                  {value =>
                    items.find(item => item.value === value)?.label ??
                    current?.name ??
                    'Nie wybrano izby'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {items.map(item => (
                  <SelectItem
                    key={item.value ?? 'none'}
                    value={item.value}
                  >
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>
              Wybór dotyczy tylko tej ścieżki nauki. Możesz go zmienić lub usunąć.
            </FieldDescription>
          </Field>
        )}
      </form.Field>
      <form.Subscribe selector={state => state.values.districtChamberId}>
        {value => (
          <Button
            type="submit"
            className="self-start"
            disabled={mutation.isPending || value === (current?.id ?? null)}
          >
            Zapisz izbę
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
