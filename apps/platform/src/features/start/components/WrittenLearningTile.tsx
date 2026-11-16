import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { LatestSessionContent } from '~platform/features/learningSession/components/LatestSessionContent'

export const WrittenLearningTile = () => {
  return (
    <Card
      role="region"
      aria-label="Nauka do egzaminu pisemnego"
      className="col-span-8 @max-3xl:col-span-full"
    >
      <CardHeader>
        <CardTitle>
          <h2>Nauka do egzaminu pisemnego</h2>
        </CardTitle>
      </CardHeader>
      <LatestSessionContent />
    </Card>
  )
}
