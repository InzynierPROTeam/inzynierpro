import {
  writtenExamAccess,
  oralExamAccess,
  bothExamAccess,
} from '@inzpro/domain/modules/preparation/exam-access'
import { PathConfiguration } from '@inzpro/domain/modules/preparation/onboarding'
import { preparationKeys } from '@inzpro/queries/modules/preparation'
import { studyKeys } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { useForm, revalidateLogic } from '@tanstack/react-form'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { Schema } from 'effect'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { dateTimeInputToUtc } from '~platform/utils/date-time-input'

import { submitOnboarding } from '../actions'
import { onboardingRouteApi } from '../utils'
import { OnboardingSearch, OnboardingFormValues } from '../validation'
import {
  SpecializationChoices,
  KindChoices,
  ScopeChoices,
  SessionChoices,
  type ChoiceState,
} from './Choices'
import { Confirmation } from './Confirmation'

const fields = ['specjalnosc', 'rodzaj', 'zakres', 'egzamin', 'sesja'] as const

const titles = [
  'Specjalność',
  'Rodzaj uprawnień',
  'Zakres uprawnień',
  'Rodzaj egzaminu',
  'Sesja egzaminacyjna',
] as const

export const OnboardingForm = () => {
  const draft = onboardingRouteApi.useSearch()
  const { user } = onboardingRouteApi.useRouteContext()
  const navigate = onboardingRouteApi.useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const step = draft.krok ?? 1
  const name = fields[step - 1] ?? 'specjalnosc'
  const mutation = useMutation({ mutationFn: submitOnboarding })

  // The URL owns the draft, including browser back/forward and return from sign-in.
  const form = useForm({
    defaultValues: {
      specjalnosc: draft.specjalnosc ?? '',
      rodzaj: draft.rodzaj ?? '',
      zakres: draft.zakres ?? '',
      egzamin: draft.egzamin ?? '',
      sesja: draft.sesja ?? '',
      terminUstnego: draft.terminUstnego ?? '',
    },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: Schema.toStandardSchemaV1(OnboardingFormValues) },
    onSubmit: async ({ value }) => {
      if (user === undefined) {
        await router.navigate({
          to: '/logowanie',
          search: { redirect: router.state.location.href },
        })

        return
      }

      toast.promise(
        async () => {
          const payload = Schema.decodeUnknownSync(PathConfiguration)({
            specializationId: value.specjalnosc,
            qualificationKindId: value.rodzaj,
            qualificationScopeId: value.zakres,
            accessScope: value.egzamin,
            examSessionId: value.sesja,
            oralExamDate: dateTimeInputToUtc(value.terminUstnego),
          })

          const receipt = await mutation.mutateAsync({ payload })
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: preparationKeys.paths(user.id) }),
            queryClient.invalidateQueries({ queryKey: preparationKeys.selection(user.id) }),
            queryClient.invalidateQueries({
              queryKey: preparationKeys.path(user.id, receipt.qualificationPathId),
            }),
            queryClient.invalidateQueries({
              queryKey: studyKeys.path(user.id, receipt.qualificationPathId),
            }),
          ])
          await router.navigate({ to: receipt.existing ? '/profil' : '/start' })
        },
        {
          loading: 'Zapisywanie ścieżki…',
          success: 'Ścieżka nauki została zapisana.',
          error: 'Nie udało się zapisać ścieżki. Sprawdź wybrane opcje.',
        },
      )
    },
  })

  const update = (field: (typeof fields)[number] | 'terminUstnego', value: string) => {
    const next = { ...draft, [field]: value || undefined }

    if (field !== 'terminUstnego') {
      const index = fields.indexOf(field)

      delete next.terminUstnego

      for (const later of fields.slice(index + 1)) {
        delete next[later]
      }
    }

    void navigate({ search: Schema.decodeUnknownSync(OnboardingSearch)(next), replace: true })
  }

  const renderChoices = (state: ChoiceState) => {
    if (state.pending) {
      return <p role="status">Wczytywanie dostępnych opcji…</p>
    }

    if (state.failed) {
      return (
        <p role="alert">
          Nie udało się wczytać opcji.{' '}
          <button
            type="button"
            onClick={state.retry}
          >
            Spróbuj ponownie
          </button>
        </p>
      )
    }

    const valid = state.choices.some(choice => choice.id === draft[name])

    return (
      <form
        className="max-w-xl space-y-6"
        onSubmit={event => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <p>Krok {step} z 5</p>
        <label className="flex flex-col gap-2">
          {titles[step - 1]}
          <select
            aria-label={titles[step - 1]}
            className="bg-background rounded-md border p-3"
            value={draft[name] ?? ''}
            onChange={event => update(name, event.target.value)}
          >
            <option value="">Wybierz opcję</option>
            {state.choices.map(choice => (
              <option
                key={choice.id}
                value={choice.id}
              >
                {choice.name}
              </option>
            ))}
          </select>
        </label>
        {state.hasMore && (
          <Button
            type="button"
            disabled={state.loadingMore}
            onClick={state.loadMore}
          >
            Wczytaj więcej opcji
          </Button>
        )}
        {state.choices.length === 0 && (
          <p role="status">Brak dostępnych opcji. Wróć i sprawdź wcześniejsze wybory.</p>
        )}
        {draft[name] && !valid && <p role="alert">Ta opcja nie jest już dostępna. Wybierz inną.</p>}
        {step === 5 && draft.egzamin !== writtenExamAccess && (
          <label className="flex flex-col gap-2">
            Termin egzaminu ustnego (opcjonalnie)
            <input
              type="datetime-local"
              value={draft.terminUstnego ?? ''}
              onChange={event => update('terminUstnego', event.target.value)}
            />
            <span>
              Podaj datę i godzinę w swojej strefie czasowej. Bez własnego terminu plan uwzględni
              orientacyjny termin sesji.
            </span>
          </label>
        )}
        <form.Subscribe selector={state => state.isValid}>
          {isValid =>
            !isValid && (
              <p role="alert">Sprawdź wybrane opcje i poprawność terminu egzaminu ustnego.</p>
            )
          }
        </form.Subscribe>
        {mutation.isError && (
          <p role="alert">Nie udało się zapisać konfiguracji. Twoje wybory zostały zachowane.</p>
        )}
        <div className="flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigate({ search: { ...draft, krok: step - 1 } })
              }}
            >
              Wstecz
            </Button>
          )}
          {step < 5 ? (
            <Button
              type="button"
              disabled={!valid}
              onClick={() => {
                void navigate({ search: { ...draft, krok: step + 1 } })
              }}
            >
              Dalej
            </Button>
          ) : draft.specjalnosc !== undefined &&
            draft.rodzaj !== undefined &&
            draft.zakres !== undefined ? (
            <Confirmation
              userId={user?.id}
              specializationId={draft.specjalnosc}
              qualificationKindId={draft.rodzaj}
              qualificationScopeId={draft.zakres}
              disabled={!valid || !draft.egzamin || mutation.isPending}
            />
          ) : (
            <p>Wróć i uzupełnij konfigurację ścieżki.</p>
          )}
        </div>
        <Link to={user === undefined ? '/' : '/profil'}>
          {user === undefined ? 'Wróć na stronę główną' : 'Wróć do profilu'}
        </Link>
      </form>
    )
  }

  return <StepChoices draft={draft}>{renderChoices}</StepChoices>
}

const StepChoices = ({
  draft,
  children,
}: {
  draft: OnboardingSearch
  children: (state: ChoiceState) => ReactNode
}) => {
  const step = draft.krok ?? 1

  if (step === 1) {
    return <SpecializationChoices>{children}</SpecializationChoices>
  }

  if (draft.specjalnosc === undefined) {
    return (
      <p>
        Najpierw wybierz specjalność. <Link to="/zacznij">Wróć do początku</Link>
      </p>
    )
  }

  if (step === 2) {
    return <KindChoices specializationId={draft.specjalnosc}>{children}</KindChoices>
  }

  if (draft.rodzaj === undefined) {
    return (
      <p>
        Najpierw wybierz rodzaj uprawnień.{' '}
        <Link
          to="/zacznij"
          search={{ ...draft, krok: 2 }}
        >
          Wróć do wyboru
        </Link>
      </p>
    )
  }

  if (step === 3) {
    return (
      <ScopeChoices
        specializationId={draft.specjalnosc}
        qualificationKindId={draft.rodzaj}
      >
        {children}
      </ScopeChoices>
    )
  }

  if (draft.zakres === undefined) {
    return (
      <p>
        Najpierw wybierz zakres uprawnień.{' '}
        <Link
          to="/zacznij"
          search={{ ...draft, krok: 3 }}
        >
          Wróć do wyboru
        </Link>
      </p>
    )
  }

  if (step === 4) {
    return children({
      choices: [
        { id: writtenExamAccess, name: 'Pisemny' },
        { id: oralExamAccess, name: 'Ustny' },
        { id: bothExamAccess, name: 'Pisemny i ustny' },
      ],
      pending: false,
      failed: false,
      retry: () => {},
      hasMore: false,
      loadingMore: false,
      loadMore: () => {},
    })
  }

  if (draft.egzamin === undefined) {
    return (
      <p>
        Najpierw wybierz rodzaj egzaminu.{' '}
        <Link
          to="/zacznij"
          search={{ ...draft, krok: 4 }}
        >
          Wróć do wyboru
        </Link>
      </p>
    )
  }

  return <SessionChoices specializationId={draft.specjalnosc}>{children}</SessionChoices>
}
