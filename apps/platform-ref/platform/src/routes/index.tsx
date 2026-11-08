import { checkHealthQueryOptions } from '@inzpro/queries/modules/health'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Schema } from 'effect'
import { useState } from 'react'

export const Route = createFileRoute('/')({ component: Home })

type Theme = 'light' | 'dark' | 'system'

function Home() {
  const { httpClient } = Route.useRouteContext()
  const health = useQuery(checkHealthQueryOptions(httpClient))
  const [theme, setTheme] = useState<Theme>('system')

  const connectionStatus =
    health.isPending || health.isFetching ? 'loading' : health.isError ? 'error' : 'ready'

  function changeTheme(value: Theme) {
    setTheme(value)
    document.documentElement.dataset.theme = value
  }

  return (
    <div className="app-shell">
      <header>
        <a
          className="brand"
          href="/"
        >
          inżynier<span>PRO</span>
        </a>
        <label className="theme-picker">
          Motyw
          <select
            value={theme}
            onChange={event =>
              changeTheme(
                Schema.decodeUnknownSync(Schema.Literals(['light', 'dark', 'system']))(
                  event.target.value,
                ),
              )
            }
          >
            <option value="system">Systemowy</option>
            <option value="light">Jasny</option>
            <option value="dark">Ciemny</option>
          </select>
        </label>
      </header>
      <main>
        <p className="eyebrow">PLATFORMA DO NAUKI · FUNDAMENT</p>
        <h1>
          Solidne fundamenty.
          <br />
          <span>Dobry początek.</span>
        </h1>
        <p className="intro">
          Tutaj powstaje Twoje miejsce do przygotowań do egzaminu na uprawnienia budowlane.
        </p>
        <section
          className="connection-card"
          aria-labelledby="connection-title"
          aria-busy={connectionStatus === 'loading'}
        >
          <div className="card-heading">
            <span className={`status-dot ${connectionStatus}`} />
            <h2 id="connection-title">Połączenie z platformą</h2>
          </div>
          <div
            role="status"
            aria-live="polite"
          >
            {connectionStatus === 'loading' && <p>Sprawdzamy połączenie z serwerem…</p>}
            {connectionStatus === 'ready' && (
              <>
                <p className="status-title">Serwer odpowiada</p>
                <p>Platforma jest połączona z serwerem.</p>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <p className="status-title">Nie możemy teraz połączyć się z platformą</p>
                <p>Sprawdź połączenie i spróbuj ponownie za chwilę.</p>
              </>
            )}
          </div>
          <button
            disabled={connectionStatus === 'loading'}
            onClick={() => {
              void health.refetch()
            }}
          >
            {connectionStatus === 'loading' ? 'Sprawdzamy…' : 'Sprawdź ponownie'}
          </button>
        </section>
        <p className="stage-note">
          Przygotowujemy pierwsze funkcje do nauki. Wkrótce pojawią się tutaj kolejne możliwości.
        </p>
      </main>
      <footer>
        InżynierPRO <span>Przygotuj się na kolejny krok.</span>
      </footer>
    </div>
  )
}
