import type { GetDocumentRes } from '@inzpro/api-client/modules/study'
import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@inzpro/ui/components/card'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import type React from 'react'

type CategorySummaryCardProps = { document: GetDocumentRes['document'] }

export const CategorySummaryCard: React.FC<CategorySummaryCardProps> = ({ document }) => (
  <Card className="@container min-w-0 flex-2">
    <CardHeader>
      <CardTitle>
        <h1>{document.title}</h1>
      </CardTitle>
      <CardDescription>Pytania do egzaminu pisemnego</CardDescription>
    </CardHeader>
    <CardContent>
      <dl className="grid grid-cols-3 gap-4 @max-sm:grid-cols-1">
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground text-sm">Ukończone</dt>
          <dd className="text-2xl font-semibold">{document.completedQuestionCount}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground text-sm">Wszystkie</dt>
          <dd className="text-2xl font-semibold">{document.availableQuestionCount}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-muted-foreground text-sm">Postęp</dt>
          <dd className="text-2xl font-semibold">
            {ratioToPercent(
              calculateCompletionRatio(
                document.completedQuestionCount,
                document.availableQuestionCount,
              ),
            )}
            %
          </dd>
        </div>
      </dl>
    </CardContent>
  </Card>
)

export const CategorySummaryCardSkeleton = () => (
  <Card className="@container min-w-0 flex-2">
    <CardHeader>
      <TextSkeleton
        size="base"
        className="max-w-lg"
      />
      <TextSkeleton
        size="sm"
        className="w-48"
      />
    </CardHeader>
    <CardContent className="grid grid-cols-3 gap-4 @max-sm:grid-cols-1">
      <StatSkeleton />
      <StatSkeleton />
      <StatSkeleton />
    </CardContent>
  </Card>
)

const StatSkeleton = () => (
  <div className="flex flex-col gap-1">
    <TextSkeleton
      size="sm"
      className="w-20"
    />
    <TextSkeleton
      size="2xl"
      className="w-12"
    />
  </div>
)
