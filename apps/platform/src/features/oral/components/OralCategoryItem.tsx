import type { GetOralMaterialsRes } from '@inzpro/api-client/modules/study'
import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@inzpro/ui/components/item'
import { Progress, ProgressSkeleton } from '@inzpro/ui/components/progress'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import type React from 'react'

type OralCategoryItemProps = { category: GetOralMaterialsRes['data'][number] }

export const OralCategoryItem: React.FC<OralCategoryItemProps> = ({ category }) => (
  <Item variant="background-soft">
    <ItemContent>
      <ItemTitle>
        <h2>{category.name}</h2>
      </ItemTitle>
      <ItemDescription>
        Ukończone: {category.completedQuestionCount} / {category.availableQuestionCount} pytań
      </ItemDescription>
      <Progress
        variant="primary"
        size="sm"
        aria-label={`Postęp nauki: ${category.name}`}
        value={ratioToPercent(
          calculateCompletionRatio(
            category.completedQuestionCount,
            category.availableQuestionCount,
          ),
        )}
      />
    </ItemContent>
  </Item>
)

export const OralCategoryItemSkeleton = () => (
  <Item variant="background-soft">
    <ItemContent>
      <TextSkeleton
        size="sm"
        leading="snug"
        className="max-w-lg"
      />
      <TextSkeleton
        size="sm"
        className="w-48"
      />
      <ProgressSkeleton size="sm" />
    </ItemContent>
  </Item>
)
