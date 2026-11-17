import { Card, CardHeader, CardTitle } from '@inzpro/ui/components/card'
import { MockExamTileContent } from '~platform/features/mockExam/components/MockExamTileContent'

export const MockExamTile = () => (
  <Card
    role="region"
    aria-label="Egzamin próbny"
    className="col-span-8 @max-3xl:col-span-full"
  >
    <CardHeader>
      <CardTitle>
        <h2>Egzamin próbny</h2>
      </CardTitle>
    </CardHeader>
    <MockExamTileContent />
  </Card>
)
