# @inzpro/email

Transactional emails: React Email templates and the `EmailService` Effect service.

**Runtime:** Server-side Node.js.

`EmailService` renders a template to HTML and plain text and sends it through an [email-sdk](https://email-sdk.dev) adapter. Production provides `layerResend`; tests provide `layer(memoryAdapter())` or `layer(failingAdapter())` from `@opencoredev/email-sdk/testing`. Templates use the design tokens of `@inzpro/ui/theme.css`; `lib/theme.css` overrides only what email clients need, such as pixel sizes (`--spacing: 4px`, so `mt-4` is 16px). Both files are read at runtime through package exports. Deciding when to send an email stays with the owning module. Client applications must not import this package.

Preview templates with `pnpm --filter @inzpro/email email:dev` (http://localhost:3030).

## Usage

```ts
import { EmailService, layerResend } from '@inzpro/email/email-service'
import { SignInCode } from '@inzpro/email/templates/sign-in-code'
```

## Dependencies

Follow the workspace dependency directions in [policy.ts](../tools/src/oxlint/architecture-policy.ts). The [architecture guide](../../docs/architecture.md) explains package placement, test exceptions, wildcard exports, and verification.
