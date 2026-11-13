import { POLISH_LANGUAGE } from '@inzpro/config/localization'
import { mobileAppStoreId } from '@inzpro/config/mobile'
import { TWITTER_HANDLE } from '@inzpro/config/social'
import { DefaultCatchBoundary } from '@inzpro/ui/components/default-catch-boundary'
import { NotFoundPage } from '@inzpro/ui/components/not-found-page'
import { Toaster } from '@inzpro/ui/components/toast'
import { CookieConsent, type TrackingConsent } from '@inzpro/ui/containers/cookie-consent'
import { ThemeProvider } from '@inzpro/ui/providers/theme-provider'
import { loadGoogleTagManager } from '@inzpro/ui/side-effects/google-tag-manager'
import { setMetaPixelConsent } from '@inzpro/ui/side-effects/meta-pixel'
import { getCanonicalHref } from '@inzpro/utils/seo'
import type { QueryClient } from '@tanstack/react-query'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { ExternalLinks, appName, seo } from '~platform/config/app'
import { organizationSchema, webSiteSchema } from '~platform/config/seo-schemas'
import { env } from '~platform/lib/env'
import sprite from '~platform/styles/sprite.svg'

import appCss from '~platform/styles/app.css?url'

function syncTrackingConsent(consent: TrackingConsent) {
  if (import.meta.env.DEV) {
    return
  }

  if (consent.analytics || consent.advertising) {
    loadGoogleTagManager(env.VITE_GOOGLE_TAG_MANAGER_ID)
  }

  setMetaPixelConsent(env.VITE_META_PIXEL_ID, consent.advertising)
}

type RootDocumentProps = { children: React.ReactNode }

const RootDocument = ({ children }: RootDocumentProps) => (
  <html
    lang={POLISH_LANGUAGE}
    suppressHydrationWarning
  >
    <head>
      <HeadContent />
    </head>
    <body className="font-main bg-background text-foreground gradient-page relative flex min-h-dvh w-full flex-col overflow-auto bg-linear-to-br antialiased">
      <ThemeProvider>
        <CookieConsent
          privacyPolicyUrl={ExternalLinks.privacyPolicy}
          onConsentChange={syncTrackingConsent}
        >
          {children}
        </CookieConsent>
        <Toaster />
        {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
      </ThemeProvider>
      <Scripts />
    </body>
  </html>
)

const RootComponent: React.FC = () => <Outlet />

type Context = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<Context>()({
  head: ({ matches }) => {
    const pathname = matches.at(-1)?.pathname ?? '/'
    const canonicalHref = getCanonicalHref(pathname, env.VITE_APP_BASE_URL.href)

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'twitter:site', content: `@${TWITTER_HANDLE}` },
        { name: 'application-name', content: appName },
        {
          name: 'apple-itunes-app',
          content: `app-id=${mobileAppStoreId}, app-argument=${canonicalHref}`,
        },
        ...seo({ url: canonicalHref, title: undefined }),
        { 'script:ld+json': organizationSchema },
        { 'script:ld+json': webSiteSchema },
      ],
      links: [
        {
          rel: 'canonical',
          href: canonicalHref,
        },
        { rel: 'preload', href: appCss, as: 'style' },
        { rel: 'stylesheet', href: appCss },
        {
          rel: 'preload',
          as: 'image',
          href: sprite,
          type: 'image/svg+xml',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '16x16',
          href: '/favicon-16x16.png',
        },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'icon', href: '/favicon.ico' },
      ],
    }
  },
  errorComponent: props => {
    return (
      <DefaultCatchBoundary
        title="Coś poszło nie tak"
        description="Wystąpił nieoczekiwany błąd. Spróbuj ponownie za chwilę."
        goBackText="Wstecz"
        tryAgainText="Spróbuj ponownie"
        {...props}
      />
    )
  },
  notFoundComponent: () => (
    <NotFoundPage
      homeHref="/"
      title="Nie znaleziono strony"
      description="Strona, której szukasz nie istnieje lub została przeniesiona."
      goBack="Wróć"
      goHome="Zacznij od początku"
    />
  ),
  shellComponent: RootDocument,
  component: RootComponent,
})
