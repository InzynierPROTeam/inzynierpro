import { ThemeSwitchButton } from '@inzpro/ui/components/theme-switch'
import { Link, Outlet } from '@tanstack/react-router'
import { appName } from '~platform/config/app'
import { LogoHorizontal } from '~platform/layout/components/Logo'

export const AppLayout = () => (
  <>
    <header className="layout-container sticky top-0 isolate z-30">
      <div className="-mb-6 h-12 w-full backdrop-blur-xs" />
      <nav
        aria-label="Nawigacja główna"
        className="layout-section px-8! py-0! max-md:px-6! max-sm:px-4!"
      >
        <div className="border-border bg-background/50 flex h-20 items-center justify-between gap-4 rounded-3xl border px-10 backdrop-blur-lg max-md:h-18 max-md:px-8">
          <Link
            to="/start"
            aria-label={appName}
          >
            <LogoHorizontal />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/profil">Profil</Link>
            <Link to="/zacznij">Dodaj ścieżkę</Link>
            <ThemeSwitchButton />
          </div>
        </div>
      </nav>
    </header>
    <main className="layout-container isolate flex min-h-0 flex-1 flex-col overflow-x-hidden">
      <Outlet />
    </main>
  </>
)
