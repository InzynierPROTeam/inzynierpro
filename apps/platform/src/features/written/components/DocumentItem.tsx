import type { GetDocumentsRes } from '@inzpro/api-client/modules/written-study'
import { ratioToPercent } from '@inzpro/domain/common/percent'
import { calculateCompletionRatio } from '@inzpro/domain/common/progress'
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

type DocumentItemProps = { document: GetDocumentsRes['data'][number] }

export const DocumentItem: React.FC<DocumentItemProps> = ({ document }) => (
  <Item
    variant="background-soft"
    render={
      <Link
        to="/nauka/kategoria/$id"
        params={{ id: document.id }}
      />
    }
  >
    <ItemContent>
      <ItemTitle>
        <h2>{document.title}</h2>
      </ItemTitle>
      <ItemDescription>
        Ukończone: {document.completedQuestionCount} / {document.availableQuestionCount} pytań
      </ItemDescription>
      <Progress
        variant="primary"
        size="sm"
        aria-label={`Postęp nauki: ${document.title}`}
        value={ratioToPercent(
          calculateCompletionRatio(
            document.completedQuestionCount,
            document.availableQuestionCount,
          ),
        )}
      />
    </ItemContent>
    <ItemActions>
      <ChevronRight aria-hidden="true" />
    </ItemActions>
  </Item>
)

export const DocumentItemSkeleton = () => (
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
