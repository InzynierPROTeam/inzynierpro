import type { ReferenceDocumentId } from '@inzpro/domain/modules/learning-content/reference-document'
import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import type React from 'react'
import { FavoritesTileContent } from '~platform/features/favorites/components/FavoritesTileContent'

type CategoryFavoritesCardProps = { categoryId: ReferenceDocumentId }

/** The learner's FavoriteQuestions of one category, studied in their own session (ADR-0002). */
export const CategoryFavoritesCard: React.FC<CategoryFavoritesCardProps> = ({ categoryId }) => {
  return (
    <Card
      role="region"
      aria-label="Ulubione z kategorii"
      className="flex-1"
    >
      <CardHeader>
        <CardTitle>
          <h2>Ulubione z kategorii</h2>
        </CardTitle>
      </CardHeader>
      <FavoritesTileContent documentId={categoryId} />
    </Card>
  )
}
