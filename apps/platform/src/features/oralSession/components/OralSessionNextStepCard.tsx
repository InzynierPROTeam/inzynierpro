import type { OralSessionNextStep } from '@inzpro/api-contracts/modules/study/responses'
import {
  reviewNextStep,
  continueStudyNextStep,
  startStudyNextStep,
} from '@inzpro/domain/modules/study/study-session'
import { oralSessionNextStepQueryOptions } from '@inzpro/queries/modules/study'
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
import { Mic2, Play } from 'lucide-react'
import type React from 'react'
import { SuspenseQuery, SuspenseQueryWrapper } from '~platform/components/SuspenseQueryBoundary'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'
import { apiHttpClient } from '~platform/lib/api-client'

import { oralSessionSummaryRouteApi } from '../utils'
import { ContinueOralSessionButton } from './ContinueOralSessionButton'

export const OralSessionNextStepCard = () => {
  const {
    selectedPath,
    session: { user },
  } = onboardedRouteApi.useRouteContext()

  const { sessionId } = oralSessionSummaryRouteApi.useParams()

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
            options={oralSessionNextStepQueryOptions(apiHttpClient, user.id, {
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

type NextStepItemProps = { step: OralSessionNextStep }

const NextStepItem: React.FC<NextStepItemProps> = ({ step }) =>
  Match.value(step).pipe(
    Match.discriminatorsExhaustive('type')({
      [reviewNextStep]: ({ category, dueQuestionCount }) => (
        <SuggestedItem
          icon={<Mic2 />}
          title="Powtórz pytania ustne"
          description={`Pytania do powtórki: ${dueQuestionCount}`}
          action={
            <Button
              nativeButton={false}
              render={
                <Link
                  to="/ustny/powtorka"
                  search={{ kategoria: category?.id }}
                />
              }
            >
              Przejdź do powtórki
            </Button>
          }
        />
      ),
      [continueStudyNextStep]: ({ session }) => (
        <SuggestedItem
          icon={<Play />}
          title={session.category?.name ?? 'Wszystkie kategorie'}
          description={`Oceniono ${session.progress.answered} / ${session.progress.total}`}
          action={
            <ContinueOralSessionButton session={session}>Kontynuuj sesję</ContinueOralSessionButton>
          }
        />
      ),
      [startStudyNextStep]: ({ preview }) => (
        <SuggestedItem
          icon={<Mic2 />}
          title={preview.category.name}
          description={`Liczba pytań: ${preview.settings.defaultQuestionCount}`}
          action={
            <Button
              nativeButton={false}
              className="max-sm:flex-1"
              render={
                <Link
                  to="/ustny/start"
                  search={{ kategoria: preview.category.id }}
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
      <ItemDescription>Na tej ścieżce nie ma teraz pytań ustnych do nauki.</ItemDescription>
    </ItemContent>
    <ItemActions>
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link to="/ustny" />}
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
