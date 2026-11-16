# @inzpro/e2e

Browser tests of critical user flows across the platform and the API.

**Runtime:** Playwright (Chromium) on Node.js. Not a dependency of any application.

## Running

```sh
pnpm test:e2e
```

The command starts throwaway PostgreSQL and Redis, migrates them, then Playwright starts:

- the API from `apps/api/src/test/e2e-server.ts` on port 4100: production HTTP composition, the technical catalogue, the catalogue test date, and sent e-mails appended to `.outbox/emails.jsonl`;
- a production build of the platform served by `vite preview` in the Cloudflare runtime on port 8101.

CI runs two workers on one runner; unique accounts and client addresses isolate the tests. A retry records diagnostics but a flaky pass still fails CI.

The ports differ from local development, so the suite runs beside `pnpm dev`. After a failure, open the trace with `pnpm --filter @inzpro/e2e exec playwright show-trace <trace.zip>`.

## Writing tests

- Specs live in `src/*.spec.ts`; fixtures and helpers in `src/test/`.
- Start from the `visitor`, `signedIn` or `onboarded` fixtures. `test.use({ accessScope: 'written' })` changes the exam parts of the `onboarded` path, and `test.use({ pathConfiguration: smallPathConfiguration })` onboards to the small second path, whose learning round takes three answers.
- Each test is its own client address and its own account, so tests run in parallel.
- Follow the E2E rules in [CODING_STANDARDS.md](../../CODING_STANDARDS.md#testing).

## Dependencies

Follow the workspace dependency directions in [policy.ts](../../packages/tools/src/oxlint/architecture-policy.ts). The suite reaches the applications over HTTP only; it never imports their sources.
