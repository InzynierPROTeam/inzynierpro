# Configured paths, goals and access

A shared QualificationPath is a unique combination of specialization, qualification kind and scope. A separate user–path assignment holds the exam access scope (written, oral or both) and archive state. A user may have several assignments and one active selection. Scope can only widen, from written or oral to both. Changing the selection or passing the exam date never removes history or revokes access.

Onboarding loads dependent options from the catalog and requires a target session matching the specialization's parent chamber. A district chamber is optional, and study never requires one. A session has an explicit availability window that includes oral preparation after the written exam. A personal oral date is optional; without it, planning uses the session's labelled approximate date. The final command creates the assignment, the first goal and the selection atomically, validating the configuration again. Retrying neither duplicates the assignment nor overwrites an existing goal.

UserExamGoal is versioned. Changing the session or date appends a new version without repointing earlier activity; commands use the goal version as their expected version. Web restores the onboarding draft from the URL and clears dependent choices when an earlier step changes. Earlier steps never grant access.

Paths are a section of the account profile: add, select, edit the goal, extend access, archive and restore. Archiving the selected path switches to the most recently used active path or clears the selection. Opening a study kind outside the user's scope offers an explicit extension to both, currently free, and then returns to the originally requested page. Opening the page alone never extends anything.

Daily planning, XP, rankings and reset execution are separate work (ADR-0010).

## Public onboarding

Onboarding is public until the configuration is saved. Separate endpoints return specializations, dependent kinds and scopes, and exam sessions, in public contract groups without authentication. Individual assignments and mutations stay protected and their data appears only after sign-in. The redirect to sign-in keeps the full draft in the URL.
