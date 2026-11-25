import { getRouteApi } from '@tanstack/react-router'

export const oralQuestionDetailsRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/pytanie/$questionId',
)
