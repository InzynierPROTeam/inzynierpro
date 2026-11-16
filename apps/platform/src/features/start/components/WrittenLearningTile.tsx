import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { useId } from 'react'
import { LatestSessionContent } from '~platform/features/learningSession/components/LatestSessionContent'

export const WrittenLearningTile = () => {
  const titleId = useId()

  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      // The reviews tile fills the rest of the row.
      className="col-span-8 @max-3xl:col-span-full"
    >
      <CardHeader>
        <CardTitle>
          <h2 id={titleId}>Nauka do egzaminu pisemnego</h2>
        </CardTitle>
      </CardHeader>
      <LatestSessionContent />
    </Card>
  )
}
