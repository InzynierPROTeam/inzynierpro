import { Button } from '@inzpro/ui/components/button'
import { Link } from '@tanstack/react-router'
import { appName } from '~platform/config/app'

export const HeroSection = () => (
  <section className="layout-section @container flex-1 items-center gap-12 pt-40! text-center max-md:pt-20! max-sm:pt-14!">
    <div className="flex max-w-4xl flex-col items-center gap-4">
      <p className="text-muted-foreground mb-4 text-sm">Platforma {appName}</p>
      <h1 className="text-5xl font-bold text-balance max-lg:text-4xl max-sm:text-3xl">
        Witaj na platformie <span className="gradient-text-brand">{appName}</span>
      </h1>
      <p className="text-muted-foreground max-w-2xl text-lg text-balance max-lg:text-base">
        Wybierz ścieżkę nauki i sesję egzaminacyjną, aby przejść do materiałów dla swoich uprawnień.
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Button
        variant="border-primary"
        size="lg"
        nativeButton={false}
        render={<Link to="/zacznij" />}
      >
        Rozpocznij przygotowania
      </Button>
      <Button
        size="lg"
        nativeButton={false}
        render={
          <Link
            to="/logowanie"
            search={{ redirect: '/start' }}
          />
        }
      >
        Zaloguj się
      </Button>
    </div>
  </section>
)
