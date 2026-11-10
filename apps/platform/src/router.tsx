import { QUERY_CACHE_TIME, QUERY_STALE_TIME } from '@inzpro/react-utils/react-query/shared'
import { DefaultCatchBoundary } from '@inzpro/ui/components/default-catch-boundary'
import { NotFound } from '@inzpro/ui/components/not-found'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { getQueryClient } from '~platform/lib/reactQuery'

import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = getQueryClient()

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultErrorComponent: props => (
      <DefaultCatchBoundary
        homeHref="/"
        title="Coś poszło nie tak"
        description="Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę."
        goBackText="Wstecz"
        homeText="Strona główna"
        tryAgainText="Spróbuj ponownie"
        {...props}
      />
    ),
    defaultNotFoundComponent: () => (
      <NotFound
        homeHref="/"
        title="404"
        subtitle="Nie znaleziono strony"
        description="Strona, której szukasz nie istnieje lub została przeniesiona."
        goBack="Wróć"
        goHome="Zacznij od początku"
      />
    ),
    defaultGcTime: QUERY_CACHE_TIME,
    defaultPreloadGcTime: QUERY_CACHE_TIME,
    defaultStaleTime: QUERY_STALE_TIME,
    defaultPreloadStaleTime: QUERY_STALE_TIME,
    defaultStructuralSharing: true,
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
