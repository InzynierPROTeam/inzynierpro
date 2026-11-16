import type { OralReviewPreview } from '@inzpro/api-contracts/modules/study/responses'
import type { OralQuestionCategoryId } from '@inzpro/domain/modules/learning-content/oral-question-category'
import {
  oralReviewPreviewQueryOptions,
  oralReviewSessionQueryOptions,
} from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { CardContent, CardDescription, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { SessionTileContentSkeleton } from '~platform/features/learningSession/components/LatestSessionContent'
import { SessionProgress } from '~platform/features/learningSession/components/SessionProgress'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { ContinueOralSessionButton } from '~platform/features/oralSession/components/ContinueOralSessionButton'
import { apiHttpClient } from '~platform/lib/api-client'

import { noDueReviewsMessage } from '../utils'

type OralReviewTileContentProps = {
  categoryId?: OralQuestionCategoryId
}

export const OralReviewTileContent: React.FC<OralReviewTileContentProps> = ({ categoryId }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const req = { params: { qualificationPathId: selectedPath.id }, query: { categoryId } }

  return (
    <SuspenseQueryWrapper fallback={<SessionTileContentSkeleton actionLabel="Powtórz pytania" />}>
      <SuspenseQuery
        options={oralReviewSessionQueryOptions(apiHttpClient, user.id, req)}
        isDataEmpty={session => session === null}
        noDataFallback={
          <SuspenseQuery
            options={oralReviewPreviewQueryOptions(apiHttpClient, user.id, req)}
            isDataEmpty={preview => preview === null}
            noDataFallback={<NoReviewsContent />}
          >
            {preview => <OralReviewPreviewContent preview={preview} />}
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
              <ContinueOralSessionButton session={session}>
                Kontynuuj powtórkę
              </ContinueOralSessionButton>
            </CardFooter>
          </>
        )}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type OralReviewPreviewContentProps = { preview: OralReviewPreview }

const OralReviewPreviewContent: React.FC<OralReviewPreviewContentProps> = ({ preview }) =>
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
              to="/ustny/powtorka"
              search={{ kategoria: preview.category?.id }}
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
