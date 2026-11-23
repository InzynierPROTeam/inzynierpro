# Account deletion and data retention

A user may delete their account from the profile through a confirmation dialog that explains what is removed and what stays. The signed-in session authorizes it; we chose a simple dialog over extra re-authentication. We delete the account, private notes and individual learning history. Truly anonymous question statistics are kept, because they help assess difficulty and quality of specific revisions, including the split between independent and assisted attempts. Replacing the user ID with another ID is not sufficient anonymization. The statistics are therefore aggregate tables without any user identifier, updated with each answer and grouped by revision and day, so no individual sequence can be rebuilt from them. Neither account deletion nor a path reset touches them.

Approved contributions to material remain after their content is checked for personal data, credited to "deleted user". Keeping individual answer sequences for SRS research would need its own justification and retention rules; it does not follow from keeping anonymous statistics.

Immutability of learning events (ADR-0005) protects results from being overwritten in normal operation; it does not forbid deleting account data.

There is no self-service data export. An individual request can be handled, without an exporter in settings or a package-generation process at launch.

After confirmation the account, its sessions and notifications are blocked immediately, and data cleanup runs as a durable background job that is safe to retry after a failure. The user is told the account is deleted and signed out; no e-mail is sent. Sign-in and sign-up with that e-mail are refused until cleanup finishes, after which the e-mail may register a new, empty account. Reports keep their content with the author removed. A test fails when any table referencing a user is neither deleted nor explicitly anonymized.
