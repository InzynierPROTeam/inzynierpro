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

/**
 * Where an answered or withdrawn question leads: the summary of an ended session; ending the session
 * from its last question or once every remaining question was withdrawn (ADR-0003); otherwise the
 * following question.
 */
export const sessionNextStep = (
  position: SessionQuestionPosition,
  session: Pick<StudySession, 'status' | 'progress'>,
): 'summary' | 'end' | 'next' =>
  session.status === endedStudySession
    ? 'summary'
    : position >= session.progress.total || !hasOpenQuestions(session.progress)
      ? 'end'
      : 'next'

/**
 * The one withdrawal notice a session question shows, if any. Once every question left without an
 * answer was withdrawn, the session can only end, so that notice replaces the one for the question
 * itself (ADR-0003). It is not shown on the last question after a regular answer, which ends the
 * session anyway.
 */
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

/** The question as the backend now holds it after refusing an answer to its withdrawn revision. */
export const withdrawnQuestion = (question: SessionQuestion): SessionQuestion => ({
  ...question,
  isWithdrawn: true,
  answer: null,
})

type SessionScope = Pick<StudySessionSummary, 'kind' | 'document'>

// One label per session kind, so a new kind cannot be left without one.
const sessionScopeLabels = {
  [regularStudySession]: summary => summary.document?.title ?? '',
  [reviewStudySession]: summary => `Powtórka: ${summary.document?.title ?? 'wszystkie kategorie'}`,
  [favoritesStudySession]: summary =>
    summary.document === null ? 'Ulubione pytania' : `Ulubione: ${summary.document.title}`,
} satisfies Record<StudySessionKind, (summary: SessionScope) => string>

/**
 * What an ended session covered: its category, or for a review or favourites session the category
 * or the whole path.
 */
export const sessionScopeLabel = (summary: SessionScope): string =>
  sessionScopeLabels[summary.kind](summary)
