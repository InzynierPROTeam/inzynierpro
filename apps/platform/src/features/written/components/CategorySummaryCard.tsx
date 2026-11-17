import type { GetDocumentRes } from '@inzpro/api-client/modules/written-study'
import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@inzpro/ui/components/card'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from '@inzpro/ui/components/item'
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
      <ItemGroup
        render={<dl />}
        className="grid grid-cols-3 gap-4 @max-sm:grid-cols-1"
      >
        <SummaryStat label="Ukończone">{document.completedQuestionCount}</SummaryStat>
        <SummaryStat label="Wszystkie">{document.availableQuestionCount}</SummaryStat>
        <SummaryStat label="Postęp">
          {ratioToPercent(
            calculateCompletionRatio(
              document.completedQuestionCount,
              document.availableQuestionCount,
            ),
          )}
          %
        </SummaryStat>
      </ItemGroup>
    </CardContent>
  </Card>
)

type SummaryStatProps = { label: string; children: React.ReactNode }

const SummaryStat: React.FC<SummaryStatProps> = ({ label, children }) => (
  <Item className="p-0">
    <ItemContent className="gap-1">
      <ItemDescription render={<dt />}>{label}</ItemDescription>
      <ItemTitle
        render={<dd />}
        className="text-2xl font-semibold"
      >
        {children}
      </ItemTitle>
    </ItemContent>
  </Item>
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
