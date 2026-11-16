import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { hasExamAccess } from '@inzpro/utils/exam-access'
import { cx } from 'tailwind-variants'
import { FavoritesTileContent } from '~platform/features/favorites/components/FavoritesTileContent'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

export const FavoritesTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <Card
      role="region"
      aria-label="Ulubione pytania"
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
