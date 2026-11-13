import type { GetSessionPreviewRes } from '@inzpro/api-client/modules/study'
import { Button } from '@inzpro/ui/components/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { List, Scale, Split } from 'lucide-react'
import type React from 'react'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

import { getSessionQuestionCount, sessionPreviewRouteApi } from '../utils'
import { QuestionCountDialog } from './QuestionCountDialog'

type SessionPreviewCardProps = { preview: NonNullable<GetSessionPreviewRes> }

export const SessionPreviewCard: React.FC<SessionPreviewCardProps> = ({ preview }) => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()
  const search = sessionPreviewRouteApi.useSearch()
  const count = getSessionQuestionCount(preview.settings, search['liczba-pytan'])

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1>Zacznij sesję nauki</h1>
        </CardTitle>
        <CardDescription>
          Poniżej znajdziesz szczegóły sesji nauki. Możesz ją przerwać w dowolnym momencie i wrócić
          do niej później.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-8">
          <div className="flex items-start gap-4">
            <IconWrapper>
              <Split />
            </IconWrapper>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-sm">Specjalność</dt>
              <dd>
                {selectedPath.specialization.name} • {selectedPath.qualificationKind.name} •{' '}
                {selectedPath.qualificationScope.name}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <IconWrapper>
              <Scale />
            </IconWrapper>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-sm">Kategoria</dt>
              <dd>{preview.document.title}</dd>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <IconWrapper>
              <List />
            </IconWrapper>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-sm">Liczba pytań</dt>
              <dd className="flex items-center gap-2">
                {count}
                {preview.settings.canChangeQuestionCount && (
                  <QuestionCountDialog
                    settings={preview.settings}
                    count={count}
                  />
                )}
              </dd>
            </div>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        {/* TODO: Wire the start mutation when the backend can create study sessions. */}
        <Button disabled>Zacznij sesję</Button>
        <p className="text-muted-foreground text-xs">
          {preview.availableQuestionCount === 0
            ? 'Pytania dla tej kategorii nie są jeszcze dostępne.'
            : 'Rozpoczynanie sesji jest obecnie niedostępne.'}
        </p>
      </CardFooter>
    </Card>
  )
}

export const SessionPreviewCardSkeleton = () => (
  <Card>
    <CardHeader>
      <TextSkeleton
        size="base"
        className="w-56"
      />
      <TextSkeleton
        size="sm"
        lines={2}
        className="max-w-xl"
      />
    </CardHeader>
    <CardContent className="flex flex-col gap-8">
      <DetailSkeleton className="max-w-lg" />
      <DetailSkeleton className="max-w-64" />
      <DetailSkeleton className="max-w-32" />
    </CardContent>
    <CardFooter className="flex-col items-start gap-2">
      <Skeleton className="h-9 w-32 rounded-4xl" />
      <TextSkeleton
        size="xs"
        className="w-64"
      />
    </CardFooter>
  </Card>
)

type DetailSkeletonProps = { className?: string }

const DetailSkeleton: React.FC<DetailSkeletonProps> = ({ className }) => (
  <div className="flex items-start gap-4">
    <Skeleton className="size-10 shrink-0 rounded-full" />
    <div className="flex w-full flex-col gap-1">
      <TextSkeleton
        size="sm"
        className="w-24"
      />
      <TextSkeleton
        size="sm"
        className={className}
      />
    </div>
  </div>
)
