import type { SessionPreview } from '@inzpro/api-contracts/modules/study/responses'
import { getRouteApi } from '@tanstack/react-router'

export const sessionPreviewRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/start',
)

export const getSessionQuestionCount = (
  settings: SessionPreview['settings'],
  requested: number | undefined,
): number =>
  settings.canChangeQuestionCount &&
  requested !== undefined &&
  requested >= settings.minimumQuestionCount &&
  requested <= settings.maximumQuestionCount
    ? requested
    : settings.defaultQuestionCount
