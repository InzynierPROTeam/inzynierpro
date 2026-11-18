import { ThemeSwitchButton } from '@inzpro/ui/components/theme-switch'
import { Link } from '@tanstack/react-router'
import { appName } from '~platform/config/app'
import { LearningXpTotal } from '~platform/features/learningXp/components/LearningXpTotal'
import { StreakButton } from '~platform/features/streak/components/StreakButton'
import { LogoVertical, LogoHorizontal } from '~platform/layout/components/Logo'
import { ProfileButton } from '~platform/layout/components/ProfileButton'

import { MobileMenu } from './MobileMenu'
import { Sidebar } from './Sidebar'

export const Header = () => (
  <header className="layout-container sticky top-0 isolate z-30">
    <div className="-mb-6 h-12 w-full backdrop-blur-xs" />
    <nav
      aria-label="Główna nawigacja"
      className="layout-section relative px-8! py-0! max-md:px-6! max-sm:px-4!"
    >
      <Sidebar />
      <div className="border-border bg-background/50 grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-3xl border px-10 backdrop-blur-lg max-md:h-18 max-md:px-8">
        <div className="flex items-center justify-center justify-self-start max-lg:order-3 max-lg:justify-self-end">
          <MobileMenu />
          <Link
            to="/start"
            className="max-lg:hidden"
            aria-label={appName}
          >
            <LogoHorizontal />
          </Link>
        </div>

        <div className="max-lg:order-2">
          <Link
            to="/start"
            className="lg:hidden"
            aria-label={appName}
          >
            <LogoVertical />
          </Link>
        </div>
        <div className="flex h-min items-center justify-center gap-2 justify-self-end max-lg:order-1 max-lg:flex-row-reverse max-lg:justify-self-start">
          <LearningXpTotal />
          <StreakButton />
          <ThemeSwitchButton />
          <ProfileButton />
        </div>
      </div>
    </nav>
  </header>
)
