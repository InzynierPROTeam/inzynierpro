import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { Button } from '@inzpro/ui/components/button'
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
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { finishExam } from '../actions'
import { attemptQuestionRouteApi } from '../utils'

export const FinishAttemptButton = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { attemptId } = attemptQuestionRouteApi.useParams()
  const params = { qualificationPathId: selectedPath.id, attemptId }
  const client = useQueryClient()

  const { data: attempt } = useQuery(
    mockExamAttemptQueryOptions(apiHttpClient, user.id, { params }),
  )

  const mutation = useMutation({
    mutationFn: finishExam,
    onSuccess: result =>
      client.setQueryData(mockExamKeys.getMockExamAttempt(user.id, { params }), result),
  })

  const finish = () =>
    toast.promise(mutation.mutateAsync({ params }), {
      loading: { title: 'Zapisywanie wyniku…' },
      success: { title: 'Egzamin został zakończony.' },
      error: () => ({ title: 'Nie udało się zakończyć egzaminu. Spróbuj ponownie.' }),
    })

  if (attempt === undefined || attempt === null) {
    return null
  }

  if (attempt.status === 'finished') {
    return (
      <Button
        nativeButton={false}
        render={
          <Link
            to="/egzamin-probny/podejscie/$attemptId/podsumowanie"
            params={{ attemptId }}
          />
        }
      >
        Zobacz podsumowanie
      </Button>
    )
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="self-center"
          />
        }
      >
        Zakończ egzamin
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zakończyć egzamin?</DialogTitle>
          <DialogDescription>
            Po zakończeniu nie można zmienić odpowiedzi. Pytania bez odpowiedzi liczą się jako
            błędne.
          </DialogDescription>
        </DialogHeader>
        <p>Bez odpowiedzi: {attempt.questions.filter(question => !question.isAnswered).length}</p>
        <p>Do powrotu: {attempt.questions.filter(question => question.isFlagged).length}</p>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Wróć do egzaminu</DialogClose>
          <Button
            disabled={mutation.isPending}
            onClick={finish}
          >
            Zakończ i zobacz wynik
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
