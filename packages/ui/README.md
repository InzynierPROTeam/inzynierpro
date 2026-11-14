# @inzpro/ui

Shared web UI based on shadcn conventions and Base UI primitives.

**Runtime:** React DOM applications built with Tailwind CSS v4.

Own primitives, generic error/404 views, theme controls, mobile menu behavior, consent UI and optional tracking adapters. Applications supply navigation destinations, data, callbacks and public settings. CookieConsent publishes restored consent and preference changes through onConsentChange and synchronizes Google Consent Mode. Applications use that callback to load GTM after analytics or advertising consent and to grant or revoke Meta Pixel consent. Loaders avoid duplicate initialization and do not read application env. The automatic host blocker is disabled because it also blocks GTM with analytics-only consent; additional third-party embeds need their own consent integration. GTM tags must respect their respective consent categories. Theme initialization uses TanStack Router ScriptOnce.

The package owns the shared Tailwind theme in `src/styles/globals.css`: Tailwind and shadcn imports, the font, theme variants, design tokens and base styles. It also scans the sources of this package and of `apps/*`. An application imports it at the top of its own stylesheet and adds only app-specific classes after it.

Add shadcn components from this package (`pnpm exec shadcn add <component>` in `packages/ui`). The platform's `components.json` cannot resolve `@inzpro/ui/*` yet, because applications consume the built `dist` while the CLI needs a source path alias.

## Usage

```css
@import '@inzpro/ui/globals.css';
```

```ts
import { Button } from '@inzpro/ui/components/button'
import { ThemeProvider } from '@inzpro/ui/providers/theme-provider'
```

## Dependencies

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.

## Suspense queries

`components/containers/suspense-query-boundary` provides a resettable `SuspenseQueryWrapper`, render-prop `SuspenseQuery` and `WithSuspenseQuery`. The wrapper coordinates React Suspense, an error boundary and TanStack Query error reset. Loading, empty and error presentations are supplied by the consumer; `undefined` fallbacks render nothing in the shared package.

`components/containers/suspense-infinite-query-boundary` provides the equivalent infinite-query render props, preserving page parameters, cursor types and next-page controls. Both empty-aware containers require `isDataEmpty(data)`, which receives the selected data after `options.select`; no array, null or page-count heuristics are applied. When `isDataEmpty` of `SuspenseQuery` is a type predicate, such as the inferred `data => data === null`, children receive the data without the excluded type. Query-function data and selected data are inferred independently, while the cache retains the original response. The `With…` variants expose the query result without handling empty states. Application-level defaults should compose the existing `Empty` primitives directly, keeping copy and routes outside this package.

`pnpm --filter @inzpro/ui test` runs all UI tests without React Compiler and repeats the container tests with the platform's React 19 compiler settings. The refetch regressions count React Profiler commits and render-prop calls rather than asserting environment-dependent timing thresholds.

## Card

Keep the shadcn header/content/footer composition. Card sizes are `md` (default), `sm` and `xs`; the root owns both spacing and radius through inherited CSS variables, including header, footer and edge images. Rounded sizes descend from 4xl to 3xl to 2xl. Background variants do not change composition.
