import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'

export const QuestionDetailsSkeleton = () => (
  <div className="flex flex-col gap-3">
    <TextSkeleton
      size="lg"
      className="max-w-md"
    />
    <TextSkeleton className="max-w-sm" />
    <TextSkeleton className="max-w-lg" />
    <TextSkeleton className="max-w-md" />
  </div>
)
