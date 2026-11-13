import type { GetDocumentRes } from '@inzpro/api-client/modules/study'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@inzpro/ui/components/card'
import { Skeleton } from '@inzpro/ui/components/skeleton'
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
            {document.availableQuestionCount === 0
              ? 0
              : Math.round(
                  (document.completedQuestionCount / document.availableQuestionCount) * 100,
                )}
            %
          </dd>
        </div>
      </dl>
    </CardContent>
  </Card>
)

export const CategorySummaryCardSkeleton = () => (
  <Card className="flex-2">
    <CardHeader>
      <Skeleton className="h-6 w-full max-w-lg" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="grid grid-cols-3 gap-4">
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
      <Skeleton className="h-14" />
    </CardContent>
  </Card>
)
