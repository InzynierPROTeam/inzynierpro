import { AlertCircleIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from './button.js'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty.js'
import { IconWrapper } from './icon-wrapper.js'

type DefaultCatchBoundaryProps = {
  title: ReactNode
  description: ReactNode
  goBackText: ReactNode
  tryAgainText: ReactNode
  reset: VoidFunction
  media?: React.ReactNode
}

export function DefaultCatchBoundary({
  title,
  description,
  goBackText,
  tryAgainText,
  reset,
  media,
}: DefaultCatchBoundaryProps) {
  return (
    <Empty className="max-w-xl self-center">
      <EmptyHeader>
        <EmptyMedia>
          {media !== null ? (
            media ? (
              media
            ) : (
              <IconWrapper>
                <AlertCircleIcon />
              </IconWrapper>
            )
          ) : null}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        <Button
          variant="border-primary"
          onClick={() => window.history.back()}
        >
          {goBackText}
        </Button>
        <Button onClick={reset}>{tryAgainText}</Button>
      </EmptyContent>
    </Empty>
  )
}
