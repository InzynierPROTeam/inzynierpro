# Editorial workflow, user submissions and AI assistance

## Work items

From the first release a shared internal WorkItem mechanism handles question errors, questions recalled after the exam and document work. A work item organizes the work: status, priority, assignee and history. The content of the report, question or document stays in its own domain area. The queue is internal at first; a later Community may expose selected features.

No later than the launch of reporting, authorized people get a simple internal queue view: list, details, assignment, priority and handling. It does not require a full admin panel first. Editors may link several reports to one work item, keeping each original report with its author and context. Similar exam recollections may feed shared work without being treated as identical questions automatically.

At first one authorized person may prepare, approve and publish a change. Edit, verify and publish permissions are separate, but one person may hold them all, and every decision leaves a trace. A second reviewer is not mandatory; independent review of selected changes may extend the process later.

## User submissions

An error report during study requires a short problem type and may include a comment. Context, including the exact revision, path and location, is recorded automatically; users never retype what the system knows. "Other problem" asks for a short explanation.

A question recalled after the exam is accepted as recollected content with exam context, optional notes and uncertainty about the wording, without requiring a correct answer. The original submission is kept. Editors may develop it, link it to a duplicate or reject it; a recollection never becomes a published question automatically.

Report context is the path, district chamber and exam session when known. The chamber defaults to the user's earlier choice and may be changed in the report without changing the user's settings. Several reports may point at the same question; their contexts are never replaced by independent lists of paths and chambers that suggest every possible combination.

The first release includes a short optional survey after the real exam: declared result, platform usefulness, NPS and an option to submit recalled questions. It can be skipped, and the questions need not be asked at once. Feedback is split by written and oral. Results are user declarations, not verified outcomes.

## AI through remote MCP

Remote MCP is an additional backend interface, initially for authorized editors. It lets editors work on material from external AI clients such as ChatGPT, Claude, Codex and Claude Code, without tying editorial operations to one client. Connection and authentication are verified for each supported client.

MCP tools call the same application operations as the admin panel. The backend enforces shared validation, permissions and versioning rules, and each operation runs with the authenticated person's permissions. MCP has no direct SQL access and no separate business rules. The first scope is searching and reading material, reading editorial guidelines and saving proposals for questions, oral answers and mini-quizzes. Approval and publication stay in the admin panel at first.

We do not build our own chat, model-API generation or agent runtime. Editors use their own tools and subscriptions under each provider's terms, which saves implementation time and avoids a model-API integration billed to the product. AI output is always a proposal that needs approval.

A proposal records the operation's author, time, the proposal itself and the source revisions it used. Model name and the external conversation or prompts are not required. This minimal trace allows checking a proposal after its source changes, but does not promise to reproduce the generation. If a source changed while the proposal was prepared, it is saved against the revision actually used and flagged for a compatibility check; it is never repointed automatically. The editor resolves compatibility with the current source before approval.

AI receives only the material the task needs, never private notes or individual learning history; the backend chooses the shared context. AI features using a specific learner's data need a separate design. Material and report content are data to work on, not instructions authorizing other operations. Protection against prompt injection rests on access boundaries and backend validation of operations, not on telling the model to ignore instructions in sources.

## Question quality signals

Background analysis of answer patterns points editors at potentially ambiguous questions, ineffective distractors and result changes after a content update. It accounts for revisions and attempt context instead of treating error rate alone as proof of a faulty question. Signals feed editorial review and never change a correct answer or publish anything automatically. Metrics are specified with the feature; the analysis needs no model-API integration.

Personal weak-area diagnostics and study recommendations are postponed; review selection remains the job of SRS.
