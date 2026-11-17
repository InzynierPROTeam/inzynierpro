import type { StartOralReviewSessionError } from '@inzpro/api-client/modules/oral-study'
import { OralSessionAlreadyStarted } from '@inzpro/api-contracts/modules/oral-study/errors'
import type { OralReviewPreview } from '@inzpro/api-contracts/modules/oral-study/responses'
import { formatDateTime } from '@inzpro/utils/date'
import { getRouteApi } from '@tanstack/react-router'
import { Predicate, Schema } from 'effect'

export const oralReviewPreviewRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_oralValid/ustny/powtorka',
)

export const noDueReviewsMessage = (nextDueAt: OralReviewPreview['nextDueAt']): string =>
  nextDueAt === null
    ? 'Brak zaplanowanych powtórek. Oceniaj pytania w nauce, a zaplanujemy je dla Ciebie.'
    : `Najbliższa powtórka: ${formatDateTime(nextDueAt)}.`

export const getOralReviewStartError = (error: StartOralReviewSessionError) => {
  if (Schema.is(OralSessionAlreadyStarted)(error)) {
    return {
      title: 'Masz już rozpoczętą powtórkę w tym zakresie.',
      continuation: { sessionId: error.sessionId, questionNumber: error.currentPosition },
    }
  }

  return {
    title: Predicate.isTagged(error, 'StaleSessionPreview')
      ? 'Pytania do powtórki zmieniły się. Sprawdź szczegóły i spróbuj ponownie.'
      : 'Nie udało się rozpocząć powtórki. Spróbuj ponownie.',
    continuation: null,
  }
}
