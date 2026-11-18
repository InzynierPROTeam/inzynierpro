import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import type React from 'react'

type DailyPlanSectionProps = {
  title: string
  children: React.ReactNode
}

export const DailyPlanSection: React.FC<DailyPlanSectionProps> = ({ title, children }) => (
  <section
    aria-label={title}
    className="flex flex-1 flex-col gap-3"
  >
    <h3 className="font-semibold">{title}</h3>
    {children}
  </section>
)

export const DailyPlanSectionSkeleton = () => (
  <div className="flex flex-col gap-2">
    <TextSkeleton />
    <TextSkeleton />
  </div>
)
