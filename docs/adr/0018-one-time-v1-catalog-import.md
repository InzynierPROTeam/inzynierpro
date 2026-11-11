# One-time V1 catalog import

Before the full import we run a trial on representative written questions, oral questions, oral answers and path assignments, checking mapping, relation completeness and content display, then import the whole catalog. The first release may contain all available V1 material.

The importer is one-time. On failure we reset the target V2 database being prepared and import again from scratch. There is no synchronization, run history, conflict handling between imports or extra origin-ID registry. The procedure prepares a new database before users get it; it never resets V1 or later learning history.

The import first transfers content and relations faithfully to the new model. Language and subject-matter fixes and AI proposals are a separate editorial stage. The original input stays available to check the transfer and provenance, without an in-app tracking mechanism. Editors approve publication and verification based on available evidence; neither import nor AI editing verifies material automatically.
