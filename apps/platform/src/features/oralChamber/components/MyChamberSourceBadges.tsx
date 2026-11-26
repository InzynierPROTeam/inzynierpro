import {
  officialRegionalSource,
  recollectionRegionalSource,
  type RegionalSourceKind,
} from '@inzpro/domain/modules/learning-content/regional-question-link'
import { Badge } from '@inzpro/ui/components/badge'
import { MapPin } from 'lucide-react'
import type React from 'react'

const sourceKindLabels: Record<RegionalSourceKind, string> = {
  [recollectionRegionalSource]: 'Zgłoszone w Twojej izbie',
  [officialRegionalSource]: 'Z oficjalnej puli Twojej izby',
}

type MyChamberSourceBadgesProps = { sourceKinds: ReadonlyArray<RegionalSourceKind> }

export const MyChamberSourceBadges: React.FC<MyChamberSourceBadgesProps> = ({ sourceKinds }) =>
  sourceKinds.length > 0 && (
    <ul
      aria-label="Twoja izba okręgowa"
      className="flex flex-wrap gap-2"
    >
      {sourceKinds.map(kind => (
        <li key={kind}>
          <Badge
            variant="outline-primary"
            size="sm"
          >
            <MapPin />
            {sourceKindLabels[kind]}
          </Badge>
        </li>
      ))}
    </ul>
  )
