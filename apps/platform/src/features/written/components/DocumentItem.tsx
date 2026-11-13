import type { GetDocumentsRes } from '@inzpro/api-client/modules/study'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { Progress } from '@inzpro/ui/components/progress'
import { Skeleton } from '@inzpro/ui/components/skeleton'
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
        aria-label={`Postęp nauki: ${document.title}`}
        value={
          document.availableQuestionCount === 0
            ? 0
            : Math.min(
                100,
                (document.completedQuestionCount / document.availableQuestionCount) * 100,
              )
        }
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
      <Skeleton className="h-5 w-full max-w-lg" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-2 w-full max-w-sm" />
    </ItemContent>
  </Item>
)
