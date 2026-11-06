---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with "code-review" to review the work.

Leave the implementation as uncommitted working-tree changes for the user to inspect in the editor. Report what changed and the checks performed, then incorporate the user's feedback.

Create commits, push branches, or open pull requests only when the user explicitly requests that action. Approval to implement or review changes is not approval to publish them.
