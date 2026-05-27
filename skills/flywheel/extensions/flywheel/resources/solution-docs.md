# Solution Docs

Solution docs live under:

`docs/solutions/<category>/<slug>-<YYYY-MM-DD>.md`

They are for durable learning a future agent should find. Do not create them for trivial
fixes or context-free changes.

## Frontmatter

```yaml
---
title: <feature or problem name>
date: <YYYY-MM-DD>
track: knowledge
category: <category>
tags: [lowercase-keywords]
spec: docs/specs/<slug>.md
module: <optional module>
---
```

`track` is `knowledge` or `bug`.

Use 3-8 tags a future agent would search for: component names, problem domain, technique,
error class, or convention.

## Categories

Knowledge:

- `architecture-patterns`
- `design-patterns`
- `tooling-decisions`
- `conventions`
- `workflow-issues`
- `developer-experience`
- `documentation-gaps`
- `best-practices`

Bug:

- `build-errors`
- `test-failures`
- `runtime-errors`
- `performance-issues`
- `database-issues`
- `security-issues`
- `ui-bugs`
- `integration-issues`
- `logic-errors`

## Knowledge Structure

- Context
- Guidance
- Why This Matters
- When to Apply
- Examples
- Related

## Bug Structure

- Problem
- Symptoms
- What Didn't Work
- Solution
- Why This Works
- Prevention
- Related

## Overlap Rules

- High overlap with an existing doc: update the existing doc and add `last_updated`.
- Moderate overlap: create a new doc and link the related doc.
- Low overlap: create a new doc normally.

After writing, verify it is findable: list one or two likely future searches and confirm the
title, tags, category, or module would surface the doc.
