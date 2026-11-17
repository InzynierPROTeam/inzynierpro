import type { SessionNextStep } from '@inzpro/api-contracts/modules/written-study/responses'
import {
  continueStudyNextStep,
  reviewNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/learning/study-session'
import { sessionNextStepQueryOptions } from '@inzpro/queries/modules/written-study/queries'
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
import { Match } from 'effect'
import { Play, Repeat, Scale } from 'lucide-react'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { sessionSummaryRouteApi } from '~platform/features/learningSession/utils/session'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { ContinueSessionButton } from './ContinueSessionButton'

export const SessionNextStepCard = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = sessionSummaryRouteApi.useParams()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Co dalej?</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <SuspenseQueryWrapper fallback={<NextStepItemSkeleton />}>
          <SuspenseQuery
            options={sessionNextStepQueryOptions(apiHttpClient, user.id, {
              params: { qualificationPathId: selectedPath.id, sessionId },
            })}
            isDataEmpty={step => step === null}
            noDataFallback={<NoNextStepItem />}
          >
            {step => <NextStepItem step={step} />}
          </SuspenseQuery>
        </SuspenseQueryWrapper>
      </CardContent>
    </Card>
  )
}

type NextStepItemProps = { step: SessionNextStep }

const NextStepItem: React.FC<NextStepItemProps> = ({ step }) =>
  Match.value(step).pipe(
    Match.discriminatorsExhaustive('type')({
      [reviewNextStep]: review => (
        <SuggestedItem
          icon={<Repeat />}
          title={review.document?.title ?? 'Wszystkie kategorie'}
          description={`Pytania do powtórki: ${review.dueQuestionCount}`}
          action={
            <Button
              nativeButton={false}
              className="max-sm:flex-1"
              render={
                <Link
                  to="/nauka/powtorka"
                  search={{ 'akt-prawny': review.document?.id }}
                />
              }
            >
              Powtórz pytania
            </Button>
          }
        />
      ),
      [continueStudyNextStep]: ({ session }) => (
        <SuggestedItem
          icon={<Play />}
          title={session.document.title}
          description={`Odpowiedziano ${session.progress.answered} / ${session.progress.total}`}
          action={<ContinueSessionButton session={session}>Kontynuuj sesję</ContinueSessionButton>}
        />
      ),
      [startStudyNextStep]: ({ preview }) => (
        <SuggestedItem
          icon={<Scale />}
          title={preview.document.title}
          description={`Liczba pytań: ${preview.availableQuestionCount}`}
          action={
            <Button
              nativeButton={false}
              className="max-sm:flex-1"
              render={
                <Link
                  to="/nauka/start"
                  search={{ 'akt-prawny': preview.document.id }}
                />
              }
            >
              Kontynuuj naukę
            </Button>
          }
        />
      ),
    }),
  )

type SuggestedItemProps = {
  icon: React.ReactNode
  title: string
  description: string
  action: React.ReactNode
}

const SuggestedItem: React.FC<SuggestedItemProps> = ({ icon, title, description, action }) => (
  <Item
    variant="outline"
    size="lg"
    className="border-primary/50"
  >
    <ItemMedia>
      <IconWrapper variant="primary-soft">{icon}</IconWrapper>
    </ItemMedia>
    <ItemContent className="gap-1">
      <ItemTitle className="line-clamp-2">{title}</ItemTitle>
      <ItemDescription>{description}</ItemDescription>
    </ItemContent>
    <ItemActions className="max-sm:w-full">{action}</ItemActions>
  </Item>
)

const NoNextStepItem = () => (
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

const NextStepItemSkeleton = () => (
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
  </Item>
)
