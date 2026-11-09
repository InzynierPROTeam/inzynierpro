import { Link } from '@tanstack/react-router'
import { appName } from '~platform/config/app'
import { LogoHorizontal } from '~platform/layout/components/Logo'

import { HeaderMenu } from './HeaderMenu'

export const Header = () => (
  <header className="layout-container sticky top-0 isolate z-30">
    <div className="-mb-6 h-12 w-full backdrop-blur-xs" />
    <nav
      aria-label="Główna nawigacja"
      className="layout-section px-8! py-0! max-md:px-6! max-sm:px-4!"
    >
      <div className="border-border bg-background/50 flex h-20 items-center justify-between gap-4 rounded-3xl border px-10 backdrop-blur-lg max-md:h-18 max-md:px-8">
        <Link
          to="/"
          aria-label={appName}
        >
          <LogoHorizontal />
        </Link>
        <HeaderMenu />
      </div>
    </nav>
  </header>
)
