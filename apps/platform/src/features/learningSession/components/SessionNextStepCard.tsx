import type { StudySessionSummary } from '@inzpro/api-contracts/modules/study/responses'
import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { reviewStudySession } from '@inzpro/domain/modules/study/study-session'
import {
  reviewPreviewQueryOptions,
  sessionPreviewQueryOptions,
} from '@inzpro/queries/modules/study'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { Link } from '@tanstack/react-router'
import { Repeat, Scale } from 'lucide-react'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

type SessionNextStepCardProps = { summary: StudySessionSummary }

/**
 * One step further (V1's `NextSessionTile`). After regular study it is the preview the learner
 * continues with; after a review, further due reviews of the same scope when any remain, otherwise
 * regular study (ADR-0002).
 */
export const SessionNextStepCard: React.FC<SessionNextStepCardProps> = ({ summary }) => (
  <Card>
    <CardHeader>
      <CardTitle>
        <h2>Co dalej?</h2>
      </CardTitle>
    </CardHeader>
    <CardContent>
      {summary.kind === reviewStudySession ? (
        <ReviewNextStep documentId={summary.document?.id} />
      ) : (
        <StudyNextStep fromDocumentId={summary.document?.id} />
      )}
    </CardContent>
  </Card>
)

type ReviewNextStepProps = { documentId: ReferenceDocumentId | undefined }

const ReviewNextStep: React.FC<ReviewNextStepProps> = ({ documentId }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper fallback={<NextSessionItemSkeleton />}>
      <SuspenseQuery
        options={reviewPreviewQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: { documentId },
        })}
        isDataEmpty={preview => preview === null}
        noDataFallback={<StudyNextStep fromDocumentId={documentId} />}
      >
        {preview =>
          preview.dueQuestionCount === 0 ? (
            <StudyNextStep fromDocumentId={documentId} />
          ) : (
            <Item
              variant="outline"
              size="lg"
              className="border-primary/50"
            >
              <ItemMedia>
                <IconWrapper variant="primary-soft">
                  <Repeat />
                </IconWrapper>
              </ItemMedia>
              <ItemContent className="gap-1">
                <ItemTitle className="line-clamp-2">
                  {preview.document?.title ?? 'Wszystkie kategorie'}
                </ItemTitle>
                <ItemDescription>Pytania do powtórki: {preview.dueQuestionCount}</ItemDescription>
              </ItemContent>
              <ItemActions className="max-sm:w-full">
                <Button
                  nativeButton={false}
                  className="max-sm:flex-1"
                  render={
                    <Link
                      to="/nauka/powtorka"
                      search={{ 'akt-prawny': documentId }}
                    />
                  }
                >
                  Powtarzaj dalej
                </Button>
              </ItemActions>
            </Item>
          )
        }
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

type StudyNextStepProps = { fromDocumentId: ReferenceDocumentId | undefined }

const StudyNextStep: React.FC<StudyNextStepProps> = ({ fromDocumentId }) => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  return (
    <SuspenseQueryWrapper fallback={<NextSessionItemSkeleton />}>
      <SuspenseQuery
        options={sessionPreviewQueryOptions(apiHttpClient, user.id, {
          params: { qualificationPathId: selectedPath.id },
          query: { fromDocumentId },
        })}
        isDataEmpty={preview => preview === null}
        noDataFallback={<NoNextSessionItem />}
      >
        {preview => (
          <Item
            variant="outline"
            size="lg"
            className="border-primary/50"
          >
            <ItemMedia>
              <IconWrapper variant="primary-soft">
                <Scale />
              </IconWrapper>
            </ItemMedia>
            <ItemContent className="gap-1">
              <ItemTitle className="line-clamp-2">{preview.document.title}</ItemTitle>
              <ItemDescription>Liczba pytań: {preview.availableQuestionCount}</ItemDescription>
            </ItemContent>
            <ItemActions className="max-sm:w-full">
              <Button
                nativeButton={false}
                className="max-sm:flex-1"
                render={
                  <Link
                    to="/nauka/start"
                    search={{ 'obecny-akt-prawny': fromDocumentId }}
                  />
                }
              >
                Kontynuuj naukę
              </Button>
            </ItemActions>
          </Item>
        )}
      </SuspenseQuery>
    </SuspenseQueryWrapper>
  )
}

const NoNextSessionItem = () => (
  <Item
    variant="outline"
    size="lg"
  >
    <ItemContent>
      <ItemDescription>Na tej ścieżce nie ma teraz pytań do nauki.</ItemDescription>
    </ItemContent>
    <ItemActions>
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link to="/nauka" />}
      >
        Wróć do kategorii
      </Button>
    </ItemActions>
  </Item>
)

const NextSessionItemSkeleton = () => (
  <Item
    variant="outline"
    size="lg"
  >
    <ItemMedia>
      <Skeleton className="size-10 rounded-full" />
    </ItemMedia>
    <ItemContent className="gap-1">
      <TextSkeleton
        size="sm"
        className="max-w-80"
      />
      <TextSkeleton
        size="sm"
        className="w-28"
      />
    </ItemContent>
    <ItemActions className="max-sm:w-full">
      <Button
        disabled
        className="max-sm:flex-1"
      >
        Kontynuuj naukę
      </Button>
    </ItemActions>
  </Item>
)
