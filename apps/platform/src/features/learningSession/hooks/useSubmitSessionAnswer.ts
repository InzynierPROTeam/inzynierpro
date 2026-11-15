import type {
  SubmitSessionAnswerError,
  SubmitSessionAnswerRequest,
} from '@inzpro/api-client/modules/study'
import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import type { UserId } from '@inzpro/domain/modules/identity/user'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  nextQuestionPosition,
  scoredQuestionCount,
} from '@inzpro/domain/modules/study/study-session'
import {
  sessionQueryOptions,
  sessionQuestionQueryOptions,
  studyKeys,
} from '@inzpro/queries/modules/study'
import { toast } from '@inzpro/ui/components/toast'
import { getCurrentUtcIsoDateTime } from '@inzpro/utils/date'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Predicate } from 'effect'
import { apiHttpClient } from '~platform/lib/api-client'

import { submitStudySessionAnswer } from '../actions'
import { withdrawnQuestion } from '../utils'

const sessionQueries = (userId: UserId, { params }: SubmitSessionAnswerRequest) => ({
  question: sessionQuestionQueryOptions(apiHttpClient, userId, { params }),
  session: sessionQueryOptions(apiHttpClient, userId, {
    params: { qualificationPathId: params.qualificationPathId, sessionId: params.sessionId },
  }),
})

const submitErrorMessage = (error: SubmitSessionAnswerError | Error) =>
  Predicate.isTagged(error, 'SessionAnswerAlreadySubmitted')
    ? 'Odpowiedź na to pytanie została już zapisana.'
    : 'Nie udało się zapisać odpowiedzi. Spróbuj ponownie.'

/**
 * Submits the selected answer and shows its result at once, scored from the options the question
 * read already holds. The backend's stored result then replaces the optimistic one; on failure the
 * question and session are refetched, so the screen returns to what the backend actually stored.
 * A refusal because the question was withdrawn meanwhile is no error: it is shown as withdrawn.
 */
export const useSubmitSessionAnswer = (userId: UserId) => {
  const client = useQueryClient()

  return useMutation({
    mutationFn: submitStudySessionAnswer,
    onMutate: async req => {
      const { question, session } = sessionQueries(userId, req)

      await Promise.all([client.cancelQueries(question), client.cancelQueries(session)])

      client.setQueryData(question.queryKey, current =>
        current === undefined || current === null || current.answer !== null
          ? current
          : {
              ...current,
              answer: {
                answerId: req.payload.answerId,
                isCorrect: current.answers.some(
                  answer => answer.id === req.payload.answerId && answer.isCorrect,
                ),
                isAssisted: current.explanationOpenedAt !== null,
                answeredAt: getCurrentUtcIsoDateTime(),
              },
            },
      )
      client.setQueryData(session.queryKey, current => {
        if (current === undefined || current === null) {
          return current
        }

        const { total } = current.progress
        const scored = scoredQuestionCount(current.progress)
        const answered = QuestionCount.make(Math.min(current.progress.answered + 1, scored))

        return {
          ...current,
          progress: {
            ...current.progress,
            answered,
            percent: ratioToPercent(calculateCompletionRatio(answered, scored)),
            currentQuestion: nextQuestionPosition(req.params.position, total),
          },
        }
      })
    },
    onSuccess: (result, req) => {
      const { question, session } = sessionQueries(userId, req)

      client.setQueryData(question.queryKey, result.question)
      client.setQueryData(session.queryKey, result.session)
    },
    onError: async (error, req) => {
      const { question, session } = sessionQueries(userId, req)

      // A question withdrawn while it was open is skipped, not failed: the screen shows it as
      // withdrawn at once, without the optimistic result, an error or a way to answer again (ADR-0003).
      if (Predicate.isTagged(error, 'SessionQuestionWithdrawn')) {
        client.setQueryData(question.queryKey, current =>
          current === undefined || current === null ? current : withdrawnQuestion(current),
        )
      } else {
        toast.add({ type: 'error', title: submitErrorMessage(error) })
      }

      await Promise.all([client.invalidateQueries(question), client.invalidateQueries(session)])
    },
    // Category progress, the preview and the latest-session tiles count the answer; this
    // session's reads are set above.
    onSettled: (_result, _error, { params }) =>
      client.invalidateQueries({
        queryKey: studyKeys.progress(userId, params.qualificationPathId),
      }),
  })
}
