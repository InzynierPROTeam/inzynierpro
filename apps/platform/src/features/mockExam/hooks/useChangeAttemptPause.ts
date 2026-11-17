import type { PauseMockExamAttemptError } from '@inzpro/api-client/modules/mock-exams'
import type { MockExamAttemptId } from '@inzpro/domain/modules/mock-exams/mock-exam-attempt'
import { mockExamKeys } from '@inzpro/queries/modules/mock-exams/keys'
import { mockExamAttemptQueryOptions } from '@inzpro/queries/modules/mock-exams/queries'
import { toast } from '@inzpro/ui/components/toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { pauseExam, resumeExam } from '../actions'

const changeErrorMessage = (error: PauseMockExamAttemptError | Error, failure: string) =>
  Predicate.isTagged(error, 'MockExamAttemptNotInProgress')
    ? 'To podejście już się zakończyło.'
    : failure

const useChangeAttemptPause = (
  attemptId: MockExamAttemptId,
  change: typeof pauseExam | typeof resumeExam,
  failure: string,
) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const client = useQueryClient()
  const params = { qualificationPathId: selectedPath.id, attemptId }
  const attempt = mockExamAttemptQueryOptions(apiHttpClient, user.id, { params })

  const mutation = useMutation({
    mutationFn: change,
    onSuccess: async result => {
      await client.invalidateQueries({
        queryKey: mockExamKeys.path(user.id, selectedPath.id),
        refetchType: 'none',
      })
      client.setQueryData(attempt.queryKey, result)
    },
    onError: error => {
      toast.add({ type: 'error', title: changeErrorMessage(error, failure) })

      return client.invalidateQueries(attempt)
    },
  })

  return { isPending: mutation.isPending, change: () => mutation.mutate({ params }) }
}

export const usePauseAttempt = (attemptId: MockExamAttemptId) =>
  useChangeAttemptPause(attemptId, pauseExam, 'Nie udało się wstrzymać egzaminu. Spróbuj ponownie.')

export const useResumeAttempt = (attemptId: MockExamAttemptId) =>
  useChangeAttemptPause(attemptId, resumeExam, 'Nie udało się wznowić egzaminu. Spróbuj ponownie.')
