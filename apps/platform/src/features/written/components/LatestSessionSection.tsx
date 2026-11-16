import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { LatestSessionContent } from '~platform/features/learningSession/components/LatestSessionContent'

export const LatestSessionSection = () => {
  return (
    <section
      aria-label="Kontynuuj naukę"
      className="app-layout-section @container"
    >
      <div className="grid grid-cols-12 gap-8">
        <Card className="col-span-8 @max-3xl:col-span-full">
          <CardHeader>
            <CardTitle>
              <h2>Kontynuuj naukę</h2>
            </CardTitle>
          </CardHeader>
          <LatestSessionContent />
        </Card>
      </div>
    </section>
  )
}
