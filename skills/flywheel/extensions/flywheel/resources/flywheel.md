---
name: flywheel
description: >
  Use for spec-driven Codex work on non-trivial features: draft and validate specs,
  review implementations against acceptance criteria, capture reusable solution docs, and
  refresh stale solution knowledge. Trigger when the user asks for flywheel, specs,
  acceptance review, implementation-vs-spec review, or compounding learnings.
---

# Flywheel

Flywheel is a Codex-native spec and learning loop:

1. Draft a spec in `docs/specs/<slug>.md`.
2. Validate it before implementation.
3. Implement with Codex's normal planning and editing flow.
4. Review committed, staged, unstaged, and untracked work against the spec.
5. Compound durable learning into `docs/solutions/<category>/<slug>-<date>.md`.

Use this for work where assumptions, acceptance criteria, or future reuse matter. Skip it for
trivial edits, obvious bug fixes, pure formatting, or one-file changes with no behavior
impact.

## Goal

Turn non-trivial Codex work into a traceable loop: clear intent before implementation,
evidence-based acceptance review after implementation, and durable solution knowledge when
the work is complete.

Success means:

- The spec captures the outcome, acceptance criteria, constraints, open questions, and
  validation plan before implementation starts.
- Review decisions are grounded in committed, staged, unstaged, and untracked evidence.
- Compound only runs from current clean-review evidence and records reusable decisions,
  patterns, and follow-ups.
- User-facing reports state the result, blockers, changed files or docs, and the next
  concrete action.

## Output

Keep responses concise and task-shaped:

- Draft: spec path, status, important assumptions, and prior solution docs used.
- Validate: findings first, each with section, gap, and concrete fix; say when clean.
- Review: acceptance criteria status, unexpected behavior or scope creep, metadata updates,
  and validation evidence.
- Compound: solution doc path, overlap with prior docs, spec status change, and any follow-up.
- Refresh: docs checked, stale or confirmed patterns, proposed updates, and applied changes.

## Stop Rules

Ask only when the missing information would materially change the spec, review target, or
solution doc scope. Stop instead of guessing when the spec is ambiguous, review evidence is
stale, required files are missing, or a compound request lacks a current clean review.

## Files

- Spec format: read `references/spec-template.md` before drafting, validating, reviewing, or
  compounding specs.
- Discovery cadence: read `references/brainstorm.md` when the brief is fuzzy.
- Solution docs: read `references/solution-docs.md` before compounding or refreshing.
- Review evidence hash: use `scripts/review-evidence-hash.sh` from review and compound.
  Resolve it with:
  ```bash
  FLYWHEEL_SKILL_ROOT="${FLYWHEEL_SKILL_ROOT:-${CODEX_HOME:-$HOME/.codex}/skills/flywheel}"
  ```

## Draft

When drafting:

1. Decide if a spec is warranted. If the task is trivial, say no spec is needed and why.
2. If the brief is fuzzy, ask one discovery question at a time using `references/brainstorm.md`.
3. Search existing solution docs before writing. Pick 3-6 lowercase keywords from the brief
   that name the problem domain, component or surface area, and technique or behavior. Skip
   structural words like "add", "create", "feature", and "support"; OR-join the keywords:
   ```bash
   test -d docs/solutions && rg -n -i 'csv|export|invoice|admin|authorization|streaming' docs/solutions
   ```
4. Read strong matches and incorporate relevant prior decisions, pitfalls, and patterns.
5. Write `docs/specs/<kebab-case-feature>.md` with `status: draft`.
6. Tell the user the spec path, status, and any solution docs that informed it.

## Validate

Validate against `references/spec-template.md`.

Status handling:

- `draft`: normal validation; if clean, set `status: ready`.
- `ready`: revalidate and leave status unchanged.
- `in-progress`: run validation as a sanity check, but do not change status. State that the
  spec is already in progress and findings may affect work already in flight.
- `done`: stop; tell the user the spec is finalized and a follow-up spec is needed for new
  behavior.

Return findings instead of rewriting content. Each finding should name the section, explain
the gap, and give a concrete fix. Block unresolved open questions unless the user explicitly
overrides them.

## Review

Review means acceptance review, not general code review. It checks whether the current
implementation satisfies the spec and whether it introduced behavior outside the spec.
Normal Codex review can still be useful separately for bugs, regressions, and architecture.

Locate the spec from an explicit path first. Otherwise try branch slug, then a single
`status: in-progress` spec, then the most recently modified plausible spec. Ask if still
ambiguous.

Collect all evidence, including dirty worktree state:

```bash
FLYWHEEL_SKILL_ROOT="${FLYWHEEL_SKILL_ROOT:-${CODEX_HOME:-$HOME/.codex}/skills/flywheel}"
BASE=$(git merge-base origin/HEAD HEAD 2>/dev/null \
  || git merge-base origin/main HEAD 2>/dev/null \
  || git merge-base origin/master HEAD 2>/dev/null \
  || git rev-list --max-parents=0 HEAD)
TODAY=$(date +%Y-%m-%d)
HEAD_SHA=$(git rev-parse HEAD 2>/dev/null || echo unknown)
WORKTREE_STATE=$(test -z "$(git status --porcelain)" && echo clean || echo dirty)
git diff "$BASE"...HEAD
git diff --cached
git diff
git status --short
git diff --name-only "$BASE"...HEAD
git diff --name-only --cached
git diff --name-only
git ls-files --others --exclude-standard
```

Compute the review evidence hash with full untracked file metadata/content after applying
any `ready` -> `in-progress` status change and after writing all review metadata except for
a placeholder `last_review_diff_hash: pending`. Use the shipped script so review and
compound hash byte-identical evidence:

```bash
DIFF_HASH=$(bash "$FLYWHEEL_SKILL_ROOT/scripts/review-evidence-hash.sh" "$BASE")
```

Then replace the placeholder with the computed digest. Do not inline an alternative hash
pipeline. Compound recomputes via the same script, and separator strings, untracked file
ordering, or trailing newline differences will change the digest. The script intentionally
ignores the self-referential `last_review_diff_hash` line so the metadata update does not
invalidate its own review. For Git diffs, it also omits blob `index` headers because those
headers change when only the ignored hash line changes; diff hunks still carry content
evidence.

If the spec status is `ready`, update it to `in-progress` before reporting review results.
Leave `in-progress` unchanged. If it is `draft`, warn that it has not been validated. If it
is `done`, ask whether the user meant to review already completed work before continuing.

Evaluate every acceptance criterion as `Satisfied`, `Partial`, or `Unsatisfied`. Also check
unexpected behavior and out-of-scope creep.

Report findings before summary. For each criterion, cite the evidence that supports the
status. If evidence is missing or ambiguous, mark the criterion `Partial` or `Unsatisfied`
instead of inferring intent.

Before computing the hash and reporting results, update only review metadata in spec
frontmatter with a placeholder hash:

```yaml
last_review_status: clean
last_reviewed_at: YYYY-MM-DD
last_review_base: <BASE>
last_review_head: <HEAD_SHA>
last_review_worktree: clean
last_review_diff_hash: pending
```

Use `last_review_status: findings` unless every criterion is satisfied and no unexpected
behavior or scope creep exists. Compute the hash from committed, staged, unstaged, and
full readable untracked file metadata/content evidence, then replace `pending` with the
computed digest before finishing the review.

## Compound

Compound only when the work is complete and worth future reuse.

Before writing docs:

1. Require `last_review_status: clean`. If it is missing, `findings`, or absent entirely,
   stop and tell the user to run review first.
2. Cheap path: if `last_review_worktree: clean`, the current worktree is clean, and
   `git rev-parse HEAD` equals `last_review_head`, evidence is current and the hash
   recompute can be skipped.
3. Otherwise, recompute the evidence hash using the recorded `last_review_base`, not a fresh
   merge base:
   ```bash
   FLYWHEEL_SKILL_ROOT="${FLYWHEEL_SKILL_ROOT:-${CODEX_HOME:-$HOME/.codex}/skills/flywheel}"
   bash "$FLYWHEEL_SKILL_ROOT/scripts/review-evidence-hash.sh" "<last_review_base>"
   ```
   Continue only if it equals `last_review_diff_hash`.
4. If neither path confirms the evidence is current, stop. Tell the user the implementation
   changed since the last clean review and ask them to re-run review. Do not re-evaluate
   acceptance criteria inside compound; review owns that evaluation.

Capture:

- Journey: spec final state, spec evolution, review-driven corrections, follow-ups.
- Build: changed files, reusable patterns, non-obvious decisions, rejected alternatives.
- Overlap: existing `docs/solutions/` docs with high/moderate/low overlap.

Write solution docs for future retrieval, not for narrating the whole session. Prefer
concrete file paths, reusable commands, decision rules, pitfalls, and validation checks over
general commentary.

Use subagents only when the user explicitly permits parallel agent work; otherwise do this
locally. Use `last_review_base` as the diff base for capture so the journey/build/overlap
analysis matches the reviewed evidence. Write or update a solution doc using
`references/solution-docs.md`. Then verify the doc will be found by plausible future
searches and set the spec `status: done`.

## Refresh

Refresh keeps `docs/solutions/` trustworthy. Require a narrow scope: doc path, category,
module, tag, or keyword. Do not refresh the whole store by default.

For each doc, check:

- Referenced files still exist.
- Referenced patterns still appear in code.
- Newer docs may supersede it.
- Code conventions have shifted.

Propose non-trivial updates before applying. Mechanical path fixes may be applied when
verified via `git log --follow` or equivalent evidence.
