import type { GetOralMaterialsRes } from '@inzpro/api-client/modules/oral-study'
import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
import { Button } from '@inzpro/ui/components/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { Progress, ProgressSkeleton } from '@inzpro/ui/components/progress'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import type React from 'react'

type OralCategoryItemProps = { category: GetOralMaterialsRes['data'][number] }

export const OralCategoryItem: React.FC<OralCategoryItemProps> = ({ category }) => (
  <div
    role="region"
    aria-label={category.name}
    className="flex flex-col gap-2"
  >
    <Item
      variant="background-soft"
      render={
        <Link
          to="/ustny/start"
          search={{ kategoria: category.id }}
        />
      }
    >
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
      <ItemActions>
        <ChevronRight aria-hidden="true" />
      </ItemActions>
    </Item>
    <Button
      variant="outline"
      nativeButton={false}
      render={
        <Link
          to="/ustny/powtorka"
          search={{ kategoria: category.id }}
        />
      }
    >
      Powtórz pytania
    </Button>
  </div>
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
