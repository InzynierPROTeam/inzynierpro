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
