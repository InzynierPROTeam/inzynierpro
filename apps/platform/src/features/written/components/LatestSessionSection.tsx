import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { useId } from 'react'
import { LatestSessionContent } from '~platform/features/learningSession/components/LatestSessionContent'

export const LatestSessionSection = () => {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className="app-layout-section @container"
    >
      <div className="grid grid-cols-12 gap-8">
        <Card className="col-span-8 @max-3xl:col-span-full">
          <CardHeader>
            <CardTitle>
              <h2 id={titleId}>Kontynuuj naukę</h2>
            </CardTitle>
          </CardHeader>
          <LatestSessionContent />
        </Card>
      </div>
    </section>
  )
}
