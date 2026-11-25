import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'

export const LinkedQuestionListSkeleton = () => (
  <div className="flex flex-col gap-3">
    <TextSkeleton className="max-w-md" />
    <TextSkeleton className="max-w-sm" />
  </div>
)
