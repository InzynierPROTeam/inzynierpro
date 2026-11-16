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
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { List, Scale } from 'lucide-react'
import type React from 'react'
import {
  SessionDetail,
  SessionDetails,
  SessionPathDetail,
} from '~platform/components/session/SessionDetails'

import { getSessionQuestionCount, sessionPreviewRouteApi } from '../utils'
import { QuestionCountDialog } from './QuestionCountDialog'
import { StartSessionButton } from './StartSessionButton'

type SessionPreviewCardProps = { preview: NonNullable<GetSessionPreviewRes> }

export const SessionPreviewCard: React.FC<SessionPreviewCardProps> = ({ preview }) => {
  const search = sessionPreviewRouteApi.useSearch()
  const navigate = sessionPreviewRouteApi.useNavigate()

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
        <SessionDetails>
          <SessionPathDetail />
          <SessionDetail
            icon={<Scale />}
            label="Kategoria"
          >
            {preview.document.title}
          </SessionDetail>
          <SessionDetail
            icon={<List />}
            label="Liczba pytań"
          >
            {count}
            {preview.settings.canChangeQuestionCount && (
              <QuestionCountDialog
                settings={preview.settings}
                count={count}
                onCountChange={questionCount =>
                  navigate({
                    search: previous => ({ ...previous, 'liczba-pytan': questionCount }),
                    replace: true,
                  })
                }
              />
            )}
          </SessionDetail>
        </SessionDetails>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <StartSessionButton
          documentId={preview.document.id}
          questionCount={count}
          questionSelection={preview.questionSelection}
          disabled={preview.availableQuestionCount === 0}
        />
        {preview.availableQuestionCount === 0 && (
          <p className="text-muted-foreground text-xs">
            Pytania dla tej kategorii nie są jeszcze dostępne.
          </p>
        )}
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
      <Button disabled>Zacznij sesję</Button>
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
