import type { StartMockExamAttemptError } from '@inzpro/api-client/modules/mock-exams'
import { Button } from '@inzpro/ui/components/button'
import { toast } from '@inzpro/ui/components/toast'
import { Match } from 'effect'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { useStartMockExam } from '../hooks/useStartMockExam'
import { unavailableMessages } from '../utils'

export const StartMockExamButton = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const mutation = useStartMockExam(user.id)

  const startExam = () =>
    toast.promise(mutation.mutateAsync({ params: { qualificationPathId: selectedPath.id } }), {
      loading: { title: 'Losowanie pytań egzaminu…' },
      success: { title: 'Egzamin próbny został rozpoczęty.' },
      error: (error: StartMockExamAttemptError) => ({
        title: Match.value(error).pipe(
          Match.tag('MockExamUnavailable', ({ reason }) => unavailableMessages[reason]),
          Match.orElse(() => 'Nie udało się rozpocząć egzaminu próbnego. Spróbuj ponownie.'),
        ),
      }),
    })

  return (
    <Button
      disabled={mutation.isPending}
      onClick={startExam}
    >
      Rozpocznij egzamin
    </Button>
  )
}
