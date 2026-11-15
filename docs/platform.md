# Web platform

How `apps/platform` signs users in, guards routes, keeps the selected assignment, navigates back and loads data. Feature folder layout is in [CODING_STANDARDS.md](../CODING_STANDARDS.md); onboarding, assignments and access rules are decided in [ADR-0025](adr/0025-configured-paths-goals-and-access.md).

## Authentication and guards

The client reads the session from `GET /api/v1/identity/session`, which answers `Unauthenticated` (401) without one.

| Route group         | Guards                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `_notauthenticated` | Guest-only pages.                                                                                       |
| `_authenticated`    | The app shell. Its context holds the saved assignment ID from the cookie, without fetching assignments. |
| `_onboarded`        | Pages that need an active assignment. Its context holds the resolved assignment.                        |
| `_writtenValid`     | Written material; checks written access inline before reading it.                                       |
| `_oralValid`        | Oral material; checks oral access inline before reading it.                                             |

Public onboarding at `/zacznij` sits outside all guards; its last step hands the full URL draft over to sign-in. Authenticated `/pierwsze-kroki` and the profile sit outside `_onboarded`, so a user without an active assignment can configure or restore one. There are no expiry, demo or PRO guards in the current scope.

`_authenticated` renders on the server only for same-origin, same-site and direct entries. Cross-site or unclassified entries run the guards in the browser, because the `SameSite=Strict` cookie is missing on those requests and would read as no selection, overwriting the saved one with a fallback.

## Selected assignment

The selection is a client cookie; the backend never stores it.

- `_onboarded` loads `GET /preparation/paths` (at most five assignments), resolves the cookie against the active ones and saves a valid fallback when it does not match.
- Changing the selection invalidates the router, so contexts refresh without a cookie subscription.
- The profile highlights the saved ID and never writes the selection while rendering. It shares the query cache with the sidebar.
- `browser-utils/cookie` owns the cookie policy (`Secure`, `SameSite=Strict`, host-only, `Path=/`) and a `Duration` max age; `react-utils/tanstack-start/cookies` adapts it to TanStack Start. Features supply only names and lifetimes.

## Onboarding

Both onboarding routes compose the same five step forms explicitly through their own route APIs.

- A step starts its local form from the values committed to the URL and writes back only a validated selection.
- Changing a committed parent selection clears the choices that depend on it; editing or going back commits nothing.
- Only the last public step queries the optional session. Submitting it keeps the whole committed draft through sign-in.
- Prefetch components load the next step's data independently of the fields. The session step and its prefetch share a page size of two sessions.

## Back navigation

Pages go back with `components/BackLink.tsx` and an optional typed `fallback`.

`lib/back-navigation.ts` records, per history entry, the in-app entry the user came from, keyed by the TanStack Router key and kept in sessionStorage. The URL stays clean and the origin survives reloads and back/forward. A push to another page comes from the current page; search-only pushes and replacing redirects keep the existing origin.

Only routes with `staticData.backLabel` are back targets, and the label names the link. When the origin is a back target, the link steps back through history and restores scroll; otherwise (direct entry, new tab, sign-in) it follows the fallback or renders nothing.

## Loading data

- `@inzpro/ui` owns the generic Suspense and error-reset containers. `components/SuspenseQueryBoundary.tsx` supplies the platform's loading, error and empty states; a feature may replace any of them, as the sidebar does.
- Ordinary catalogue queries cache one page per key; infinite queries use their own keys.
- Assignment responses carry the structured specialization, qualification kind and scope, so the sidebar titles a path without parsing its name.
