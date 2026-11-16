import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { OralFavoritesTileContent } from '~platform/features/oralSession/components/OralFavoritesTileContent'

export const OralFavoritesTile = () => (
  <Card
    role="region"
    aria-label="Ulubione pytania ustne"
    className="col-span-4 @max-3xl:col-span-full"
  >
    <CardHeader>
      <CardTitle>
        <h2>Ulubione pytania ustne</h2>
      </CardTitle>
    </CardHeader>
    <OralFavoritesTileContent />
  </Card>
)
