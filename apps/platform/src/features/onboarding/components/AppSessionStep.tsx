import { PathLimitReached } from '@inzpro/api-contracts/modules/preparation/errors'
import { CompleteOnboardingPayload } from '@inzpro/api-contracts/modules/preparation/requests'
import { maxUserQualificationPaths } from '@inzpro/domain/modules/preparation/config'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { Schema } from 'effect'

import { useCompleteOnboarding } from '../hooks/useCompleteOnboarding'
import { onboardingRouteApi } from '../utils/route-api'
import { updateOnboardingSearch } from '../utils/search'
import { SessionStep } from './SessionStep'

export const AppSessionStep = () => {
  const draft = onboardingRouteApi.useSearch()
  const navigate = onboardingRouteApi.useNavigate()

  const {
    session: { user },
  } = onboardingRouteApi.useRouteContext()

  const mutation = useCompleteOnboarding()

  if (
    draft.specjalnosc === undefined ||
    draft.rodzaj === undefined ||
    draft.zakres === undefined ||
    draft.egzamin === undefined
  ) {
    return null
  }

  return (
    <SessionStep
      specializationId={draft.specjalnosc}
      initialSessionId={draft.sesja}
      onBack={() => void navigate({ search: updateOnboardingSearch(draft, { krok: 4 }) })}
      submitButton={submit => (
        <Button
          type="submit"
          disabled={mutation.isPending}
          onClick={event => {
            event.preventDefault()
            void submit(async selection => {
              const payload = Schema.decodeUnknownSync(CompleteOnboardingPayload)({
                specializationId: draft.specjalnosc,
                qualificationKindId: draft.rodzaj,
                qualificationScopeId: draft.zakres,
                accessScope: draft.egzamin,
                examSessionId: selection.examSessionId,
                oralExamDate: null,
              })

              void toast.promise(mutation.mutateAsync({ userId: user.id, payload }), {
                loading: { title: 'Przygotowujemy Twoją naukę…' },
                success: receipt => ({
                  title: receipt.archived
                    ? 'Ta ścieżka znajduje się w Twoim archiwum.'
                    : 'Możesz zaczynać naukę!',
                }),
                error: error => ({
                  title: Schema.is(PathLimitReached)(error)
                    ? `Masz już ${maxUserQualificationPaths} ścieżek. Wybierz jedną z nich w profilu.`
                    : 'Nie udało się rozpocząć. Spróbuj ponownie.',
                }),
              })
            })
          }}
        >
          Rozpocznij
        </Button>
      )}
    />
  )
}
