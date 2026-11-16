---
name: no-comments
description: Review every source comment and verify explicit exceptions to the comment-free default. Use before handing back code changes or when asked to clean up comments.
---

Review against the Comments section of [CODING_STANDARDS.md](../../../CODING_STANDARDS.md). That section owns the policy.

## Scope

Use the files or diff requested by the user. By default review `git diff HEAD` (staged and unstaged changes) plus untracked source files from `git ls-files --others --exclude-standard`. If given a base ref, resolve its merge-base with HEAD and diff that commit against the working tree, adding untracked source files. Record the resolved comparison and file list so the reviewer sees the same scope. Include new files explicitly: Git diffs omit untracked contents.

Read every comment in the selected source files, with surrounding code and callers as needed. In a diff review also check meaningful information lost by deletions. Keep findings and edits within those files. Exclude generated and vendored sources; preserve comment-shaped fixture data.

## Independent review

Start a reviewer subagent in a fresh context, using the host's native delegation tool. Give it the scope, the standards path and this brief:

> Apply the Comments policy in CODING_STANDARDS.md to every comment in scope. Default to self-describing code. Internal algorithms, business rules, ports, transactions, cache invalidation and navigation choices do not qualify as exceptions just because their comments explain a reason. Verify every EXTERNAL claim against the named dependency and every CONTRACT claim against public HTTP semantics; a prefix alone proves nothing. Report narration disguised as an exception, redundant prose, inaccurate explanations and necessary information lost by deletions. For each finding give file and line, evidence and a concrete correction. List each retained prose exception with its specific justification. Report findings only; leave files unchanged. A clean review is valid. Do not delegate further.

The leading agent verifies findings and applies supported corrections. Do not mechanically prefix comments to appease lint: remove narration and reserve markers for substantiated exceptions. Handle small readability fixes within the authorized task; report larger refactors separately. Run the repository lint with `conventions/comment-policy` enabled. Recheck corrected passages; request another independent pass only when substantive new changes or unresolved concerns justify one. Report coverage, retained exceptions and verification limits. If delegation is unavailable, report that independent review could not run rather than calling a self-review independent.

Adapted from pstack's [no-comments](https://github.com/cursor/plugins/blob/main/pstack/skills/no-comments/SKILL.md) workflow and [Comment Sicko](https://github.com/cursor/plugins/blob/main/pstack/agents/comment-sicko.md), using this repository's policy.
