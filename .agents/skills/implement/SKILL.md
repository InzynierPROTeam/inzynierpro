---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

For the final `pnpm check`, save the full output to a temporary log and bring only its last 20 lines and the command's exit code into context. A successful tail is not proof of success: preserve pnpm's exit code. On failure, identify the failed stage from the saved log, then run that component separately (for example `pnpm lint`, `pnpm type-check`, `pnpm test` or `pnpm build`) and inspect its relevant diagnostics. Narrow to the affected workspace or test file when useful. Fix the failure, verify that component, and rerun `pnpm check` before handing back completed changes.

Once done, call the Skill tool with "code-review" to review the work.

Leave the implementation as uncommitted working-tree changes for the user to inspect in the editor. Report what changed and the checks performed, then incorporate the user's feedback.

Create commits, push branches, or open pull requests only when the user explicitly requests that action. Approval to implement or review changes is not approval to publish them.
