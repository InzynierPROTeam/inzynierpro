import type {
  MockExamAttempt,
  MockExamResult,
} from '@inzpro/api-contracts/modules/mock-exams/responses'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@inzpro/ui/components/card'
import { ItemGroup } from '@inzpro/ui/components/item'
import { formatDuration } from '@inzpro/utils/date'
import { Duration } from 'effect'
import { CircleCheck, CircleX, CircleHelp, Clock, Pause, Timer } from 'lucide-react'
import type React from 'react'
import { cx } from 'tailwind-variants'
import { SessionResultRing } from '~platform/features/learningSession/components/SessionResultRing'
import { SessionResultRow } from '~platform/features/learningSession/components/SessionResultRow'

import { AttemptSectionResults } from './AttemptSectionResults'

type AttemptResultCardProps = { attempt: MockExamAttempt; result: MockExamResult }

export const AttemptResultCard: React.FC<AttemptResultCardProps> = ({ attempt, result }) => (
  <Card>
    <CardHeader className="text-center">
      <CardTitle>
        <h2
          className={cx(
            'text-2xl font-semibold',
            result.passed === null
              ? 'text-muted-foreground'
              : result.passed
                ? 'text-success'
                : 'text-destructive',
          )}
        >
          Wynik:{' '}
          {result.passed === null ? 'niepełny' : result.passed ? 'zaliczony' : 'niezaliczony'}
        </h2>
      </CardTitle>
      <CardDescription>
        {result.passed === null
          ? 'Egzamin zawiera wycofane pytanie i nie ma oceny zaliczenia.'
          : `Próg zaliczenia: ${attempt.passThreshold} z ${attempt.questionCount} poprawnych odpowiedzi.`}
      </CardDescription>
      {attempt.endReason === 'time-expired' && (
        <CardDescription>Czas minął. Wynik obliczono z zapisanych odpowiedzi.</CardDescription>
      )}
    </CardHeader>
    <CardContent className="flex flex-col gap-8">
      <SessionResultRing
        total={attempt.questionCount}
        answered={attempt.questionCount - result.unanswered}
        correct={result.correct}
        percent={result.percent}
        answeredTone="muted"
      />
      <ItemGroup className="gap-5">
        <SessionResultRow
          icon={<CircleCheck />}
          iconClassName="bg-success/10 text-success"
          label="Poprawne"
          value={`${result.correct} z ${attempt.questionCount}`}
        />
        <SessionResultRow
          icon={<CircleX />}
          iconClassName="bg-destructive/10 text-destructive"
          label="Błędne łącznie"
          value={String(result.incorrect)}
        />
        <SessionResultRow
          icon={<CircleHelp />}
          label="W tym bez odpowiedzi"
          value={String(result.unanswered)}
        />
        <SessionResultRow
          icon={<Clock />}
          label="Czas rozwiązywania"
          value={formatDuration(Duration.seconds(result.activeSeconds))}
        />
        <SessionResultRow
          icon={<Pause />}
          label="Liczba przerw"
          value={String(result.pauseCount)}
        />
        <SessionResultRow
          icon={<Timer />}
          label="Czas przerw"
          value={formatDuration(Duration.seconds(result.pauseSeconds))}
        />
      </ItemGroup>
      <AttemptSectionResults result={result} />
    </CardContent>
  </Card>
)
