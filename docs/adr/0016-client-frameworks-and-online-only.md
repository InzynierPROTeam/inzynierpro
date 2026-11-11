# Client frameworks and online-only clients

The public website `apps/web` uses Astro. The study platform and admin use TanStack Start, and the later mobile app uses React Native with Expo. Versions and setup are chosen when each application is created; mobile dependencies must match the chosen Expo SDK. Business logic stays in the shared backend (ADR-0012).

The website, platform, mobile app and educational content are Polish-only. i18n is planned only for admin, added as admin grows, and never extends to multilingual study. The language rule for code and documentation is in CODING_STANDARDS.md.

The first web release and the later mobile app need a backend connection to study, with no full offline mode or answer synchronization. Clients handle lost connections, save state and retries. A confirmed answer comes from the backend; an unsaved result is never shown as saved.
