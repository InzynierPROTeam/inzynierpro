import type { StudySessionSummary } from '@inzpro/api-contracts/modules/written-study/responses'
import { scoredQuestionCount } from '@inzpro/domain/modules/learning/study-session'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { CircleCheck, CircleSlash, LightbulbOff, ListChecks } from 'lucide-react'
import type React from 'react'
import { sessionScopeLabel } from '~platform/features/learningSession/utils/session'

import { SessionResultRing } from './SessionResultRing'

type SessionResultCardProps = { summary: StudySessionSummary }

export const SessionResultCard: React.FC<SessionResultCardProps> = ({ summary }) => {
  const { result, progress } = summary
  const scored = scoredQuestionCount(progress)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Wynik sesji</h2>
        </CardTitle>
        <CardDescription className="line-clamp-2">{sessionScopeLabel(summary)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-8">
        <SessionResultRing
          total={scored}
          answered={progress.answered}
          correct={result.correct}
          percent={result.correctPercent}
        />
        <div className="flex flex-col gap-4">
          <h3 className="text-muted-foreground text-sm">W tym:</h3>
          <ItemGroup>
            <ResultRow
              icon={<ListChecks />}
              iconClassName="bg-primary/10 text-primary"
              label="Odpowiedziano na"
              value={`${progress.answered} z ${scored} pytań`}
            />
            <ResultRow
              icon={<CircleCheck />}
              iconClassName="bg-success/10 text-success"
              label="W tym poprawne"
              value={`${result.correct} z ${progress.answered}`}
            />
            <ResultRow
              icon={<LightbulbOff />}
              label="Bez podpowiedzi"
              value={`${progress.answered - result.assisted} z ${progress.answered}`}
            />
            {progress.skipped > 0 && (
              <ResultRow
                icon={<CircleSlash />}
                iconClassName="bg-muted text-muted-foreground"
                label="Wycofane pytania"
                value={`${progress.skipped} z ${progress.total} pytań nie liczy się do wyniku`}
              />
            )}
          </ItemGroup>
        </div>
      </CardContent>
    </Card>
  )
}

type ResultRowProps = {
  icon: React.ReactNode
  iconClassName?: string
  label: string
  value: string
}

const ResultRow: React.FC<ResultRowProps> = ({ icon, iconClassName, label, value }) => (
  <Item
    role="listitem"
    className="p-0"
  >
    <ItemMedia>
      <IconWrapper className={iconClassName}>{icon}</IconWrapper>
    </ItemMedia>
    <ItemContent className="gap-1">
      <ItemDescription>{label}</ItemDescription>
      <ItemTitle className="text-base font-normal">{value}</ItemTitle>
    </ItemContent>
  </Item>
)

export const SessionResultCardSkeleton = () => (
  <Card>
    <CardHeader>
      <TextSkeleton
        size="base"
        className="w-32"
      />
      <TextSkeleton
        size="sm"
        className="max-w-80"
      />
    </CardHeader>
    <CardContent className="flex flex-col gap-8">
      <Skeleton className="size-48 self-center rounded-full" />
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map(row => (
          <div
            key={row}
            className="flex items-center gap-3.5"
          >
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex w-full flex-col gap-1">
              <TextSkeleton
                size="sm"
                className="w-28"
              />
              <TextSkeleton
                size="sm"
                className="w-20"
              />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)
