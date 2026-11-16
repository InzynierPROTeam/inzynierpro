import type { ReviewPreview } from '@inzpro/api-contracts/modules/study/responses'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { reviewPreviewQueryOptions, reviewSessionQueryOptions } from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { CardContent, CardDescription, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { ContinueSessionButton } from '~platform/features/learningSession/components/ContinueSessionButton'
import { SessionTileContentSkeleton } from '~platform/features/learningSession/components/LatestSessionContent'
import { SessionProgress } from '~platform/features/learningSession/components/SessionProgress'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { noDueReviewsMessage } from '../utils'

type ReviewTileContentProps = {
  documentId?: ReferenceDocumentId
}

export const ReviewTileContent: React.FC<ReviewTileContentProps> = ({ documentId }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const req = { params: { qualificationPathId: selectedPath.id }, query: { documentId } }

  return (
    <SuspenseQueryWrapper fallback={<SessionTileContentSkeleton actionLabel="Powtórz pytania" />}>
      <SuspenseQuery
        options={reviewSessionQueryOptions(apiHttpClient, user.id, req)}
        isDataEmpty={session => session === null}
        noDataFallback={
          <SuspenseQuery
            options={reviewPreviewQueryOptions(apiHttpClient, user.id, req)}
            isDataEmpty={preview => preview === null}
            noDataFallback={<NoReviewsContent />}
          >
            {preview => <ReviewPreviewContent preview={preview} />}
          </SuspenseQuery>
        }
      >
        {session => (
          <>
            <CardContent className="flex flex-col gap-2">
              <CardDescription>Dokończ swoją powtórkę</CardDescription>
              <SessionProgress progress={session.progress} />
            </CardContent>
            <CardFooter className="mt-auto">
              <ContinueSessionButton session={session}>Kontynuuj powtórkę</ContinueSessionButton>
            </CardFooter>
          </>
        )}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type ReviewPreviewContentProps = { preview: ReviewPreview }

const ReviewPreviewContent: React.FC<ReviewPreviewContentProps> = ({ preview }) =>
  preview.dueQuestionCount > 0 ? (
    <>
      <CardContent className="flex flex-col gap-2">
        <p>Pytania do powtórki: {preview.dueQuestionCount}</p>
        <CardDescription>
          Powtórz pytania, które zaplanowaliśmy na podstawie Twoich odpowiedzi.
        </CardDescription>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          nativeButton={false}
          render={
            <Link
              to="/nauka/powtorka"
              search={{ 'akt-prawny': preview.document?.id }}
            />
          }
        >
          Powtórz pytania
        </Button>
      </CardFooter>
    </>
  ) : (
    <CardContent>
      <CardDescription>{noDueReviewsMessage(preview.nextDueAt)}</CardDescription>
    </CardContent>
  )

const NoReviewsContent = () => (
  <CardContent>
    <CardDescription>Powtórka z tej kategorii nie jest dostępna.</CardDescription>
  </CardContent>
)
