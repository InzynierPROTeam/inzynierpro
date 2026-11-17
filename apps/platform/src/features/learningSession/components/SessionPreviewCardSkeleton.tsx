import { Button } from '@inzpro/ui/components/button'
import { Card, CardHeader, CardContent, CardFooter } from '@inzpro/ui/components/card'
import { Skeleton } from '@inzpro/ui/components/skeleton'
import { TextSkeleton } from '@inzpro/ui/components/text-skeleton'
import type React from 'react'

export const SessionPreviewCardSkeleton = () => (
  <Card>
    <CardHeader>
      <TextSkeleton
        size="base"
        className="w-56"
      />
      <TextSkeleton
        size="sm"
        lines={2}
        className="max-w-xl"
      />
    </CardHeader>
    <CardContent className="flex flex-col gap-8">
      <DetailSkeleton className="max-w-lg" />
      <DetailSkeleton className="max-w-64" />
      <DetailSkeleton className="max-w-32" />
    </CardContent>
    <CardFooter className="flex-col items-start gap-2">
      <Button disabled>Zacznij sesję</Button>
      <TextSkeleton
        size="xs"
        className="w-64"
      />
    </CardFooter>
  </Card>
)

type DetailSkeletonProps = { className?: string }

const DetailSkeleton: React.FC<DetailSkeletonProps> = ({ className }) => (
  <div className="flex items-start gap-4">
    <Skeleton className="size-10 shrink-0 rounded-full" />
    <div className="flex w-full flex-col gap-1">
      <TextSkeleton
        size="sm"
        className="w-24"
      />
      <TextSkeleton
        size="sm"
        className={className}
      />
    </div>
  </div>
)
