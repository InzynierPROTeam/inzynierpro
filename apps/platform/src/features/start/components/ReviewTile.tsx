import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { ReviewTileContent } from '~platform/features/reviews/components/ReviewTileContent'

/** Reviews of the whole path: separate from "Continue learning", which stays regular study (ADR-0002). */
export const ReviewTile = () => {
  return (
    <Card
      role="region"
      aria-label="Powtórka"
      className="col-span-4 @max-3xl:col-span-full"
    >
      <CardHeader>
        <CardTitle>
          <h2>Powtórka</h2>
        </CardTitle>
      </CardHeader>
      <ReviewTileContent />
    </Card>
  )
}
