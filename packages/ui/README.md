# @inzpro/ui

Shared web UI based on shadcn conventions and Base UI primitives.

**Runtime:** React DOM applications with the consumer Tailwind theme.

Own primitives, generic error/404 views, theme controls, mobile menu behavior, consent UI and optional tracking adapters. Applications supply navigation destinations, data, callbacks and public settings. CookieConsent publishes restored consent and preference changes through onConsentChange and synchronizes Google Consent Mode. Applications use that callback to load GTM after analytics or advertising consent and to grant or revoke Meta Pixel consent. Loaders avoid duplicate initialization and do not read application env. The automatic host blocker is disabled because it also blocks GTM with analytics-only consent; additional third-party embeds need their own consent integration. GTM tags must respect their respective consent categories. Theme initialization uses TanStack Router ScriptOnce.

## Usage

```ts
import { Button } from '@inzpro/ui/button'
import { ThemeProvider } from '@inzpro/ui/providers/theme-provider'
```

## Dependencies

The permitted workspace directions are defined in [policy.ts](../tools/src/oxlint/architecture-policy.ts). Follow the [architecture guide](../../docs/architecture.md) for imports, wildcard exports, test exceptions and verification.
