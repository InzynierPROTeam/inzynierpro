import { Ghost } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button, buttonVariants } from './button.js'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './empty.js'
import { IconWrapper } from './icon-wrapper.js'

type NotFoundProps = {
  title: ReactNode
  description: ReactNode
  goBack?: ReactNode
  goHome?: ReactNode
  homeHref: string
}

export function NotFoundPage({ title, description, goBack, goHome, homeHref }: NotFoundProps) {
  return (
    <div className="layout-container flex-1">
      <section className="layout-section @container flex-1 items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <IconWrapper>
                <Ghost />
              </IconWrapper>
            </EmptyMedia>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            {goHome && (
              <a
                href={homeHref}
                className={buttonVariants({ variant: 'border-primary' })}
              >
                {goHome}
              </a>
            )}
            {goBack && <Button onClick={() => window.history.back()}>{goBack}</Button>}
          </EmptyContent>
        </Empty>
      </section>
    </div>
  )
}
