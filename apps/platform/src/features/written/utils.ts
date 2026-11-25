import { getRouteApi } from '@tanstack/react-router'

export const categoryRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/kategoria/$id',
)

export const questionDetailsRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/pytanie/$questionId',
)
