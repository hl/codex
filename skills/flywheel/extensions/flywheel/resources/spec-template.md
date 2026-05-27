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

Lifecycle setters:

- Draft sets this to `draft` on creation.
- Validate advances `draft` to `ready` when checks pass.
- Review advances `ready` to `in-progress` on its first run, signalling that implementation
  has started.
- Compound advances `in-progress` to `done`.

`in-progress` is also how review and compound find the active spec when the branch name
does not match a spec slug.

Agent-managed review metadata may be added by the review step. These keys let compound
decide whether the implementation has changed since the last clean review. Preserve them
when editing other frontmatter.

```yaml
last_review_status: clean
last_reviewed_at: YYYY-MM-DD
last_review_base: <BASE>
last_review_head: <HEAD_SHA>
last_review_worktree: clean
last_review_diff_hash: <sha256>
```

- `last_review_status`: `clean` or `findings`.
- `last_reviewed_at`: `YYYY-MM-DD` of the last review run.
- `last_review_base`: the merge-base commit-ish used as the diff range origin.
- `last_review_head`: the HEAD SHA at review time.
- `last_review_worktree`: `clean` or `dirty` at review time.
- `last_review_diff_hash`: SHA-256 of the canonical evidence inputs (committed, staged,
  unstaged, and untracked metadata/content), produced by
  `scripts/review-evidence-hash.sh`. Review writes this as `pending`, computes the digest,
  then replaces `pending` with the digest. The hash script ignores this self-referential
  line during hashing and omits Git diff `index` headers that would otherwise change with
  the ignored line.

Compound reads these and refuses to compound when they are absent or when the recorded hash
no longer matches the current worktree.

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

Validate will not promote the spec to `ready` while open questions remain unless the user
explicitly overrides.

## Where Constraints Go

The spec has no dedicated `constraints` section. Constraints distribute across the existing
sections based on shape:

- Testable or quantitative constraints, such as "completes in under 30 seconds", "no new
  dependencies", or "returns 403 for non-admins", belong in acceptance criteria.
- Negative boundaries, such as "no Excel export" or "no scheduled jobs", belong in out of
  scope.
- Situational constraints, such as "must integrate with existing auth middleware", belong in
  context, framed as existing conditions the work has to fit.

If a constraint does not fit any of these, sharpen it into a falsifiable statement.

## Example

```markdown
---
title: CSV export for invoices
status: draft
---

## Context

The invoice list view in the admin panel currently has no export. Finance has been copying
table data into spreadsheets, which breaks when columns change. They need a stable export
they can use in their existing reporting workflow.

The data already exists in the invoices table; nothing new needs to be modelled.

## Goals

- Finance can export the current invoice list as a CSV file from the admin UI without
  engineering involvement.
- The export reflects the same filters and sort order the user has applied in the UI.
- The export file has stable column names and ordering.

## Acceptance Criteria

1. The invoice list view displays an "Export CSV" button visible only to authenticated admins.
2. Clicking the button while the list shows N filtered invoices produces a CSV file containing
   exactly those N rows, in the same order shown in the UI.
3. The CSV includes a header row with these exact column names, in this order:
   `id, issued_at, customer_email, amount_cents, currency, status`.
4. Exporting a result set of 100,000 invoices completes in under 30 seconds and produces a
   single CSV file.
5. A non-admin user accessing the export endpoint directly receives HTTP 403.
6. No new dependencies are added to `package.json`.

## Out Of Scope

- Excel (.xlsx) export.
- Scheduled or recurring exports.
- Customising the column set per user.

## Open Questions

Open questions: none.
```

## Do Not Include

- Implementation details unless they are explicit constraints.
- Restatements of the request.
- Vague quality claims.
- Anything existing project docs already make obvious.
