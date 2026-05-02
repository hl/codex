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

## Files

- Spec format: read `references/spec-template.md` before drafting, validating, reviewing, or
  compounding specs.
- Discovery cadence: read `references/brainstorm.md` when the brief is fuzzy.
- Solution docs: read `references/solution-docs.md` before compounding or refreshing.

## Draft

When drafting:

1. Decide if a spec is warranted. If the task is trivial, say no spec is needed and why.
2. If the brief is fuzzy, ask one discovery question at a time using `references/brainstorm.md`.
3. Search existing solution docs before writing:
   ```bash
   test -d docs/solutions && rg -n "<domain|component|problem keywords>" docs/solutions
   ```
4. Read strong matches and incorporate relevant prior decisions, pitfalls, and patterns.
5. Write `docs/specs/<kebab-case-feature>.md` with `status: draft`.
6. Tell the user the spec path, status, and any solution docs that informed it.

## Validate

Validate against `references/spec-template.md`.

Status handling:

- `draft`: normal validation; if clean, set `status: ready`.
- `ready`: revalidate and leave status unchanged.
- `in-progress`: validate only if explicitly requested; do not change status.
- `done`: do not validate as pre-implementation work; suggest a follow-up spec or refresh.

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

Compute the review evidence hash with full untracked file contents:

```bash
{
  git diff "$BASE"...HEAD
  git diff --cached
  git diff
  git ls-files --others --exclude-standard | while IFS= read -r f; do
    printf '\n--- untracked: %s ---\n' "$f"
    test -f "$f" && cat "$f"
  done
} | shasum -a 256
```

Evaluate every acceptance criterion as `Satisfied`, `Partial`, or `Unsatisfied`. Also check
unexpected behavior and out-of-scope creep.

After the report, update only review metadata in spec frontmatter:

```yaml
last_review_status: clean
last_reviewed_at: YYYY-MM-DD
last_review_base: <BASE>
last_review_head: <HEAD_SHA>
last_review_worktree: clean
last_review_diff_hash: <sha256>
```

Use `last_review_status: findings` unless every criterion is satisfied and no unexpected
behavior or scope creep exists. Compute the hash from committed, staged, unstaged, and
full readable untracked file evidence.

## Compound

Compound only when the work is complete and worth future reuse.

Before writing docs:

1. Require `last_review_status: clean`, or run a local final acceptance gate.
2. Recompute the review evidence hash. If it differs from `last_review_diff_hash`, run the
   final acceptance gate against current evidence.
3. Stop if any criterion is partial/unsatisfied, or if unexpected behavior/scope creep exists.

Capture:

- Journey: spec final state, spec evolution, review-driven corrections, follow-ups.
- Build: changed files, reusable patterns, non-obvious decisions, rejected alternatives.
- Overlap: existing `docs/solutions/` docs with high/moderate/low overlap.

Use subagents only when the user explicitly permits parallel agent work; otherwise do this
locally. Write or update a solution doc using `references/solution-docs.md`. Then verify the
doc will be found by plausible future searches and set the spec `status: done`.

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
