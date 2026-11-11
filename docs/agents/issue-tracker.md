# Issue tracker: GitHub

Issues and specs live in GitHub Issues for InzynierPROTeam/inzynierpro.
Use the gh CLI from this repo.

## Conventions

- Before creating issues, verify the target with
  `gh repo view --json nameWithOwner`.
- Create issues with `gh issue create --title "..." --body-file <file>`.
  Use a temporary file for multiline bodies.
- Read issues with
  `gh issue view <number> --json number,title,body,labels,comments`.
- List issues with `gh issue list`, filtering by state and label.
- Comment with `gh issue comment <number> --body-file <file>`.
- Apply or remove labels with `gh issue edit <number> --add-label "..."`
  or `--remove-label "..."`.
- To close an issue, post the explanation first, then run
  `gh issue close <number>`, so explanations are preserved even when
  the issue is already closed.
- Use native GitHub sub-issues for parent/child relationships.
  If unavailable, add `Part of #<parent>` to the child and link it
  in a task list on the parent.
- Use native GitHub issue dependencies for blockers.
  If unavailable, add `Blocked by: #<number>` to the child.
  Work is startable when every blocker is closed.

When a skill says "publish to the issue tracker", create a GitHub issue.
When it says "fetch the relevant ticket", read the GitHub issue.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Wayfinding operations

- The map is one issue labelled `wayfinder:map`.
- Link child tickets to the map as sub-issues, or use the parent/child
  fallback above. Label children `wayfinder:<type>`, where type is
  research, prototype, grilling, or task.
- The frontier is the map's open, unassigned children with no open
  blockers; select the first in map order.
- Claim a ticket with `gh issue edit <number> --add-assignee @me`.
- Resolve by commenting with the answer, closing the ticket, and adding
  a summary and link to the map's Decisions-so-far.

## Merging stacked pull requests

`gh pr merge` and the synchronous REST merge refuse a PR that is part of a stack.
Merge from the bottom of the stack up with the asynchronous endpoint:

```sh
gh api -X PUT repos/InzynierPROTeam/inzynierpro/pulls/<number>/merge-async -f merge_method=merge
gh api repos/InzynierPROTeam/inzynierpro/pulls/<number>/merge-async/<uuid>
```

The first call returns `status: pending` and a `uuid`; poll the second until it is
`merged` or `failed`. After the bottom PR merges, the next one retargets to `main`.
