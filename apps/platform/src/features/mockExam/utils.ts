import {
  type MockExamUnavailableReason,
  noExamBlueprint,
  tooFewExamQuestions,
} from '@inzpro/domain/modules/mock-exams/exam-blueprint'
import { getRouteApi } from '@tanstack/react-router'

export const attemptQuestionRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/egzamin-probny/podejscie/$attemptId/$questionNumber',
)

export const unavailableMessages = {
  [noExamBlueprint]: 'Egzamin próbny nie jest jeszcze dostępny na Twojej ścieżce.',
  [tooFewExamQuestions]:
    'Egzamin próbny jest chwilowo niedostępny: w jednej z części brakuje pytań do losowania.',
} satisfies Record<MockExamUnavailableReason, string>

export const attemptSummaryRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/egzamin-probny/podejscie/$attemptId/podsumowanie',
)
