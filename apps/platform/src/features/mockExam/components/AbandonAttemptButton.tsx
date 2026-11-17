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
import { constVoid } from 'effect/Function'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { abandonExam } from '../actions'
import { attemptQuestionRouteApi } from '../utils'

export const AbandonAttemptButton = () => {
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
    mutationFn: abandonExam,
    onSuccess: result =>
      client.setQueryData(mockExamKeys.getMockExamAttempt(user.id, { params }), result),
    onError: () =>
      client.invalidateQueries({
        queryKey: mockExamKeys.attempt(user.id, selectedPath.id, attemptId),
      }),
  })

  const abandon = () =>
    toast
      .promise(mutation.mutateAsync({ params }), {
        loading: { title: 'Porzucanie egzaminu…' },
        success: { title: 'Egzamin został porzucony.' },
        error: () => ({ title: 'Nie udało się porzucić egzaminu. Spróbuj ponownie.' }),
      })
      .catch(constVoid)

  if (attempt?.status !== 'in-progress' && attempt?.status !== 'paused') {
    return null
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" />}>Porzuć egzamin</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Porzucić egzamin?</DialogTitle>
          <DialogDescription>
            Podejście pozostanie w historii bez wyniku. Odpowiedzi nie wpłyną na Twoje powtórki. Tej
            operacji nie można cofnąć.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Wróć do egzaminu</DialogClose>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={abandon}
          >
            Porzuć bez wyniku
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
