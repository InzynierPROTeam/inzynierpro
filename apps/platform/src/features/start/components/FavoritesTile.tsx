import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { FavoritesTileContent } from '~platform/features/favorites/components/FavoritesTileContent'

export const FavoritesTile = () => {
  return (
    <Card
      role="region"
      aria-label="Ulubione pytania"
      className="col-span-4 @max-3xl:col-span-full"
    >
      <CardHeader>
        <CardTitle>
          <h2>Ulubione pytania</h2>
        </CardTitle>
      </CardHeader>
      <FavoritesTileContent />
    </Card>
  )
}
