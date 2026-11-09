# Coding standards

Judgement calls for review. Mechanical rules live in Oxlint (`.oxlintrc.json`); this file covers what a linter cannot decide.

## Follow V1

When V1 (`~/Developer/inzynier-pro`) already solves the same problem (a form, an auth flow, a feature folder, a package), the V2 code mirrors its shape and naming. A deviation earns a one-line reason in the change: a V1 bug, a missing V2 dependency, or an Effect v4 API difference.

## Frontend features

A feature folder `apps/<app>/src/features/<feature>/` holds:

- `<Name>Page.tsx`: the page component a route renders directly (`component: SignInPage`).
- `components/`: components used only by this feature.
- `hooks/`: hooks used only by this feature. App-wide hooks live in `src/hooks/`.
- `actions.ts`: calls to external clients, such as the Better Auth client.
- `validation.ts`: schemas for search params and other feature input. Shared schemas live in `src/` or in `@inzpro/domain`.
- `utils.ts`: `getRouteApi` constants (`signInPageRouteApi`) and feature helpers.
- `types/`: request and response types derived from the client calls.

A helper with nothing feature-specific in it belongs in `src/utils/<name>.ts`.

Components read route state (search params, route context) through the feature's route API constant at the place that uses it. Props carry component inputs, not route state passed down the tree.

## Forms

Forms use TanStack `useForm` with `revalidateLogic()` and an Effect schema through `Schema.toStandardSchemaV1`, as in `features/auth/components/SignInForm.tsx`. Field state lives in the form, not in `useState`. Failed submissions surface through `toast.promise`; auth failures use `getAuthErrorMessage` from `@inzpro/auth-client/error`.

## Effect

- Failures flow through the Effect error channel: `Effect.tryPromise` at the promise boundary, then `catchTag`, `catchIf` or `option`. Absence is an `Option`, not `null`.
- A value used once stays inline at its call site. A module constant such as `const isEmail = Schema.is(Email)` earns its place only through reuse or a name that explains something the expression does not.

## Thin wrappers

Shared packages that adapt one layer to another stay thin: `@inzpro/queries` passes an api-client action to `effectQueryOptions`, nothing more. A function that only renames another call (`const currentSessionOptions = () => currentSessionQueryOptions(apiHttpClient)`) is inlined at its call sites.
