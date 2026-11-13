import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from '@inzpro/ui/components/empty'
import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { RadioGroup } from '@inzpro/ui/components/radio-group'
import { Array } from 'effect'
import { ListFilter } from 'lucide-react'
import type React from 'react'

import { SelectItemSkeleton } from './SelectItem'

const gridClassName =
  'grid grid-cols-[repeat(auto-fit,minmax(min(calc(100vw-3rem),150px),1fr))] gap-8 @max-2xl:gap-6'

type ChoiceGridProps = {
  name: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  onBlur: () => void
  invalid?: boolean
  labelId: string
}

export const ChoiceGrid: React.FC<ChoiceGridProps> = ({
  name,
  value,
  onChange,
  children,
  onBlur,
  invalid,
  labelId,
}) => (
  <RadioGroup
    name={name}
    value={value || null}
    onValueChange={onChange}
    onBlur={onBlur}
    className={`group/choices ${gridClassName}`}
    aria-labelledby={labelId}
    aria-describedby={`${name}-description`}
    aria-invalid={invalid}
  >
    {children}
  </RadioGroup>
)

type ChoiceGridSkeletonProps = { count: number }

export const ChoiceGridSkeleton: React.FC<ChoiceGridSkeletonProps> = ({ count }) => (
  <div
    className={gridClassName}
    role="status"
    aria-label="Wczytywanie dostępnych opcji"
  >
    {Array.makeBy(count, index => (
      <SelectItemSkeleton key={index} />
    ))}
  </div>
)

export const EmptyChoices = () => (
  <Empty>
    <EmptyHeader>
      <EmptyMedia>
        <IconWrapper>
          <ListFilter />
        </IconWrapper>
      </EmptyMedia>
      <EmptyTitle>Brak dostępnych opcji</EmptyTitle>
      <EmptyDescription>Wróć i sprawdź wcześniejsze wybory.</EmptyDescription>
    </EmptyHeader>
  </Empty>
)
