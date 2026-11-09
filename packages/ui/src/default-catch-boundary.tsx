import type { ReactNode } from 'react'

import { Button, buttonVariants } from './button.js'

type DefaultCatchBoundaryProps = {
  title: ReactNode
  description: ReactNode
  homeText: ReactNode
  goBackText: ReactNode
  tryAgainText: ReactNode
  homeHref: string
  reset: VoidFunction
}

export function DefaultCatchBoundary({
  title,
  description,
  homeText,
  goBackText,
  tryAgainText,
  homeHref,
  reset,
}: DefaultCatchBoundaryProps) {
  return (
    <section
      className="layout-section flex-1 items-center justify-center gap-6 text-center text-balance"
      role="alert"
    >
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="text-current/70">{description}</p>
      <div className="flex flex-wrap items-center gap-4">
        <a
          href={homeHref}
          className={buttonVariants({ variant: 'outline-primary' })}
        >
          {homeText}
        </a>
        <Button
          variant="outline-primary"
          onClick={() => window.history.back()}
        >
          {goBackText}
        </Button>
        <Button onClick={reset}>{tryAgainText}</Button>
      </div>
    </section>
  )
}
