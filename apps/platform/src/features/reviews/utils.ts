import type { ReviewPreview } from '@inzpro/api-contracts/modules/written-study/responses'
import { getRouteApi } from '@tanstack/react-router'

export const reviewPreviewRouteApi = getRouteApi(
  '/(app)/_authenticated/_onboarded/_writtenValid/nauka/powtorka',
)

export const noDueReviewsMessage = (nextDueAt: ReviewPreview['nextDueAt']): string =>
  nextDueAt === null
    ? 'Brak zaplanowanych powtórek. Odpowiadaj na pytania w nauce, a zaplanujemy je dla Ciebie.'
    : 'Na teraz nie masz pytań do powtórki. Wróć do nich później.'
