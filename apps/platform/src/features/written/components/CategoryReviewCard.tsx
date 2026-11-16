import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import type React from 'react'
import { ReviewTileContent } from '~platform/features/reviews/components/ReviewTileContent'

type CategoryReviewCardProps = { categoryId: ReferenceDocumentId }

export const CategoryReviewCard: React.FC<CategoryReviewCardProps> = ({ categoryId }) => {
  return (
    <Card
      role="region"
      aria-label="Powtórka z kategorii"
      className="flex-1"
    >
      <CardHeader>
        <CardTitle>
          <h2>Powtórka z kategorii</h2>
        </CardTitle>
      </CardHeader>
      <ReviewTileContent documentId={categoryId} />
    </Card>
  )
}
