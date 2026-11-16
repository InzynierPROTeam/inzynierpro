---
name: no-comments
description: Review comment quality in changed code or selected files, preserving meaningful constraints and identifying explanations that belong in names, types or structure. Use before handing back code changes or when asked to clean up comments.
---

Review against the Comments section of [CODING_STANDARDS.md](../../../CODING_STANDARDS.md). That section owns the policy.

## Scope

Use the files or diff requested by the user. By default review `git diff HEAD` (staged and unstaged changes) plus untracked source files from `git ls-files --others --exclude-standard`. If given a base ref, resolve its merge-base with HEAD and diff that commit against the working tree, adding untracked source files. Record the resolved comparison and file list so the reviewer sees the same scope. Include new files explicitly: Git diffs omit untracked contents.

Read surrounding code and callers as needed to understand a comment, while keeping findings and edits within the selected scope. In a diff review, assess added or changed comments, comments whose accuracy the changed code affects, and meaningful information lost by deletions. A request to clean up whole files covers every comment in those files. Exclude generated and vendored sources; preserve comment-shaped fixture data.

## Independent review

Start a reviewer subagent in a fresh context, using the host's native delegation tool. Give it the scope, the standards path and this brief:

> Review comments in the selected scope against CODING_STANDARDS.md, especially its Comments section. Read full surrounding code rather than judging isolated prose. Verify claimed constraints where possible. Report redundant or inaccurate comments, small readability changes that would replace explanations, and necessary information removed by the diff. For each finding give file and line, evidence, and a concrete correction. Distinguish safe deletions from refactors and uncertain claims. Report findings only; leave files unchanged. A clean review is a valid result. Do not delegate further.

The leading agent checks findings against the implementation, applies supported corrections and preserves useful information. Handle small readability fixes within the authorized task; report larger refactors separately. Recheck corrected passages; request another independent pass only when substantive new changes or unresolved concerns justify one. Report coverage, remaining findings and any verification limits. If delegation is unavailable, explicitly report that independent review could not run rather than describing a self-review as independent.

Adapted from pstack's [no-comments](https://github.com/cursor/plugins/blob/main/pstack/skills/no-comments/SKILL.md) workflow and [Comment Sicko](https://github.com/cursor/plugins/blob/main/pstack/agents/comment-sicko.md), using this repository's policy.
