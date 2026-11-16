import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { cx } from 'tailwind-variants'
import { FavoritesTileContent } from '~platform/features/favorites/components/FavoritesTileContent'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

/** Favourites of the path: resumed from here, not from "Continue learning" (ADR-0002). */
export const FavoritesTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <Card
      role="region"
      aria-label="Ulubione pytania"
      // Oral study fills the rest of the row when the path includes it.
      className={cx(
        '@max-3xl:col-span-full',
        hasExamAccess(selectedPath.accessScope, oralExamAccess) ? 'col-span-4' : 'col-span-full',
      )}
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
