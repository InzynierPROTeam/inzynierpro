# Account deletion and data retention

A user may delete their account from settings after re-confirming their identity. We delete the account, private notes and individual learning history. Truly anonymous question statistics are kept, because they help assess difficulty and quality of specific revisions, including the split between independent and assisted attempts. Replacing the user ID with another ID is not sufficient anonymization.

Approved contributions to material remain after their content is checked for personal data, credited to "deleted user". Keeping individual answer sequences for SRS research would need its own justification and retention rules; it does not follow from keeping anonymous statistics.

Immutability of learning events (ADR-0005) protects results from being overwritten in normal operation; it does not forbid deleting account data.

There is no self-service data export. An individual request can be handled, without an exporter in settings or a package-generation process at launch.

After confirmation the account, its sessions and reminders are blocked immediately, and data cleanup runs as a durable background job that is safe to retry after a failure. The UI distinguishes an accepted request from completed deletion.
