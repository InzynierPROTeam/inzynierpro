import { IconWrapper } from '@inzpro/ui/components/icon-wrapper'
import { RadioGroupItemRaw } from '@inzpro/ui/components/radio-group'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import type { LucideIcon } from 'lucide-react'
import type React from 'react'

type SelectItemProps = {
  name: string
  value: string
  icon: LucideIcon
  description?: React.ReactNode
}

export const SelectItem: React.FC<SelectItemProps> = ({ name, value, icon: Icon, description }) => (
  <RadioGroupItemRaw
    value={value}
    className="group group-aria-invalid/choices:border-destructive data-invalid:border-destructive data-checked:border-primary border-border bg-card text-card-foreground @container relative flex cursor-pointer flex-col items-center gap-4 rounded-2xl border p-4 text-center shadow-md"
  >
    <IconWrapper className="group-data-checked:text-primary text-muted-foreground @max-7xs:size-8 transition-colors">
      <Icon className="size-4" />
    </IconWrapper>
    <span className="flex flex-col">
      <span className="text-sm font-medium">{name}</span>
      {description && <span className="text-muted-foreground text-xs">{description}</span>}
    </span>
  </RadioGroupItemRaw>
)

export const SelectItemSkeleton = () => (
  <Skeleton className="@container flex flex-col items-center justify-center gap-4 rounded-2xl p-4">
    <Skeleton className="@max-7xs:size-8 size-12 shrink-0 rounded-full" />
    <div className="flex w-full flex-col items-center">
      <TextSkeleton
        size="sm"
        className="max-w-28"
      />
      <TextSkeleton
        size="xs"
        className="max-w-24"
      />
    </div>
  </Skeleton>
)
