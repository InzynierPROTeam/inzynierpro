import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { OralReviewTileContent } from '~platform/features/oralReviews/components/OralReviewTileContent'

export const OralReviewTile = () => (
  <Card
    role="region"
    aria-label="Powtórka ustna"
    className="col-span-4 @max-3xl:col-span-full"
  >
    <CardHeader>
      <CardTitle>
        <h2>Powtórka ustna</h2>
      </CardTitle>
    </CardHeader>
    <OralReviewTileContent />
  </Card>
)
