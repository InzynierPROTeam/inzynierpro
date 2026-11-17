import type { OralStudySessionSummary } from '@inzpro/api-contracts/modules/oral-study/responses'
import { oralSelfAssessmentValues } from '@inzpro/domain/modules/oral-study/oral-study-session'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@inzpro/ui/components/card'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@inzpro/ui/components/item'
import { CircleSlash } from 'lucide-react'
import type React from 'react'

import { selfAssessmentLevels } from '../utils'

type OralSessionResultCardProps = { summary: OralStudySessionSummary }

export const OralSessionResultCard: React.FC<OralSessionResultCardProps> = ({ summary }) => {
  const { result, progress } = summary

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Twoja samoocena</h2>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {summary.category?.name ?? 'Wszystkie kategorie'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {oralSelfAssessmentValues.map(value => {
            const { Icon, iconClassName, label } = selfAssessmentLevels[value]

            return (
              <ResultRow
                key={value}
                icon={<Icon />}
                iconClassName={iconClassName}
                label={label}
                value={result[value]}
                total={progress.total}
              />
            )
          })}
          {progress.skipped > 0 && (
            <ResultRow
              icon={<CircleSlash />}
              iconClassName="bg-muted text-muted-foreground"
              label="Wycofane pytania"
              value={progress.skipped}
              total={progress.total}
            />
          )}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

type ResultRowProps = {
  icon: React.ReactNode
  iconClassName: string
  label: string
  value: number
  total: number
}

const ResultRow: React.FC<ResultRowProps> = ({ icon, iconClassName, label, value, total }) => (
  <Item
    role="listitem"
    className="p-0"
  >
    <ItemMedia>
      <IconWrapper className={iconClassName}>{icon}</IconWrapper>
    </ItemMedia>
    <ItemContent className="gap-1">
      <ItemDescription>{label}</ItemDescription>
      <ItemTitle className="text-base font-normal">{`${value} z ${total}`}</ItemTitle>
    </ItemContent>
  </Item>
)
