import { oralExamAccess } from '@inzpro/domain/modules/preparation/exam-access'
import { Button } from '@inzpro/ui/components/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@inzpro/ui/components/card'
import { Link } from '@tanstack/react-router'
import { cx } from 'tailwind-variants'
import { onboardedRouteApi } from '~platform/features/onboarding/utils/route-api'

export const OralLearningTile = () => {
  const { selectedPath } = onboardedRouteApi.useRouteContext()

  return (
    <Card
      className={cx(
        selectedPath.accessScope === oralExamAccess
          ? 'col-span-full'
          : 'col-span-4 @max-3xl:col-span-full',
      )}
    >
      <CardHeader>
        <CardTitle>
          <h2>Nauka do egzaminu ustnego</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>Przygotuj się do odpowiedzi przed komisją egzaminacyjną.</p>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          nativeButton={false}
          render={<Link to="/ustny" />}
        >
          Zacznij naukę
        </Button>
      </CardFooter>
    </Card>
  )
}
