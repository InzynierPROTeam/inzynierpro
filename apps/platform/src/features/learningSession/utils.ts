import type {
  SessionCountSettings,
  SessionQuestion,
  StudySession,
  StudySessionSummary,
} from '@inzpro/api-contracts/modules/study/responses'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import {
  endedStudySession,
  favoritesStudySession,
  hasOpenQuestions,
  regularStudySession,
  reviewStudySession,
  type SessionQuestionPosition,
  type StudySessionKind,
} from '@inzpro/domain/modules/study/study-session'
import { getRouteApi } from '@tanstack/react-router'

export const sessionPreviewRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/start',
)

export const getSessionQuestionCount = (
  settings: SessionCountSettings,
  requested: number | undefined,
): QuestionCount =>
  settings.canChangeQuestionCount &&
  requested !== undefined &&
  requested >= settings.minimumQuestionCount &&
  requested <= settings.maximumQuestionCount
    ? QuestionCount.make(requested)
    : settings.defaultQuestionCount

export const sessionQuestionRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/sesja/$sessionId/$questionNumber',
)

export const sessionSummaryRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/sesja/$sessionId/podsumowanie',
)

export const sessionNextStep = (
  position: SessionQuestionPosition,
  session: Pick<StudySession, 'status' | 'progress'>,
): 'summary' | 'end' | 'next' =>
  session.status === endedStudySession
    ? 'summary'
    : position >= session.progress.total || !hasOpenQuestions(session.progress)
      ? 'end'
      : 'next'

// A terminal withdrawal notice replaces the question notice, except after a regular final answer
// which already ends the session (ADR-0003).
export const sessionWithdrawalNotice = (
  question: Pick<SessionQuestion, 'position' | 'isWithdrawn' | 'answer'>,
  session: Pick<StudySession, 'status' | 'progress'> | null | undefined,
): 'question' | 'remaining' | null => {
  const isSkipped = question.isWithdrawn && question.answer === null

  if (
    session !== null &&
    session !== undefined &&
    session.status !== endedStudySession &&
    !hasOpenQuestions(session.progress) &&
    session.progress.skipped > 0 &&
    (isSkipped || question.position < session.progress.total)
  ) {
    return 'remaining'
  }

  return isSkipped ? 'question' : null
}

export const withdrawnQuestion = (question: SessionQuestion): SessionQuestion => ({
  ...question,
  isWithdrawn: true,
  answer: null,
})

type SessionScope = Pick<StudySessionSummary, 'kind' | 'document'>

const sessionScopeLabels = {
  [regularStudySession]: summary => summary.document?.title ?? '',
  [reviewStudySession]: summary => `Powtórka: ${summary.document?.title ?? 'wszystkie kategorie'}`,
  [favoritesStudySession]: summary =>
    summary.document === null ? 'Ulubione pytania' : `Ulubione: ${summary.document.title}`,
} satisfies Record<StudySessionKind, (summary: SessionScope) => string>

export const sessionScopeLabel = (summary: SessionScope): string =>
  sessionScopeLabels[summary.kind](summary)
