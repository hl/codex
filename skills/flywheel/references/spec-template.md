# Spec Template

Write specs for LLM agents. Precision beats prose polish.

## Path

`docs/specs/<kebab-case-feature-name>.md`

Use a feature slug, not a change-type slug: `csv-export-invoices`, not `add-csv-export`.

## Frontmatter

```yaml
---
title: <human-readable feature name>
status: draft
---
```

Allowed statuses:

- `draft`: written, not validated.
- `ready`: validated and ready for implementation.
- `in-progress`: implementation underway.
- `done`: accepted and compounded.

Review metadata may be added by the review step:

```yaml
last_review_status: clean
last_reviewed_at: YYYY-MM-DD
last_review_base: <BASE>
last_review_head: <HEAD_SHA>
last_review_worktree: clean
last_review_diff_hash: <sha256>
```

## Required Sections

### Context

What exists today, what problem this solves, and why it matters. Do not describe the
solution here.

### Goals

Observable outcomes. Avoid implementation choices unless the choice is a hard constraint
with a reason.

### Acceptance Criteria

Numbered, falsifiable, observable checks. One outcome per criterion.

Forbidden vague words unless immediately defined by an observable check:
`handles`, `supports`, `manages`, `properly`, `correctly`, `appropriately`.

Good criterion:

`POST /export with a missing email field returns HTTP 400 with body {"error":"email required"}.`

Bad criterion:

`The system handles invalid input correctly.`

### Out Of Scope

Explicit boundaries. If nothing is adjacent, write `Out of scope: none.`

### Open Questions

Anything that would force an implementation assumption. If empty, write
`Open questions: none.`

## Do Not Include

- Implementation details unless they are explicit constraints.
- Restatements of the request.
- Vague quality claims.
- Anything existing project docs already make obvious.
