import type { SessionPreview } from '@inzpro/api-contracts/modules/study/responses'
import { QuestionCount } from '@inzpro/domain/modules/learning-content/reference-document'
import { getRouteApi } from '@tanstack/react-router'

export const sessionPreviewRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/start',
)

export const getSessionQuestionCount = (
  settings: SessionPreview['settings'],
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
