import type { ReactNode } from 'react'

import { Button, buttonVariants } from './button.js'

type NotFoundProps = {
  title: ReactNode
  subtitle?: ReactNode
  description?: ReactNode
  goBack?: ReactNode
  goHome?: ReactNode
  homeHref: string
}

export function NotFound({
  title,
  subtitle,
  description,
  goBack,
  goHome,
  homeHref,
}: NotFoundProps) {
  return (
    <div className="layout-container flex-1">
      <section className="layout-section @container flex-1 items-center justify-center gap-4 text-center">
        <h1 className="text-primary text-6xl font-bold">{title}</h1>
        {subtitle && <h2 className="text-2xl font-semibold">{subtitle}</h2>}
        {description && <p className="text-muted-foreground">{description}</p>}
        <div className="flex flex-wrap gap-4">
          {goHome && (
            <a
              href={homeHref}
              className={buttonVariants({ variant: 'outline-primary' })}
            >
              {goHome}
            </a>
          )}
          {goBack && <Button onClick={() => window.history.back()}>{goBack}</Button>}
        </div>
      </section>
    </div>
  )
}
