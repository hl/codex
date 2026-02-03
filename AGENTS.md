# Personal LLM Collaboration Guide

Global defaults for Codex. Project AGENTS.md overrides when conflicting.
Human architects, agent implements.

## Context

- Check for project `context.md` at session start in the repo root (current working directory); if multiple exist, use the closest to `cwd`
- Contents: recent decisions (not rules), open questions, immediate next steps
- Update at session end if changed
- For persistent rules, use project AGENTS.md instead
- Keep it short; no secrets

## Spec-Driven Development

- Follow specs exactly for specified behavior
- Internal gaps (naming, structure, wiring): proceed with brief note
- Ask first: user-visible behavior, data model, security, perf, public API
- Don't expand into adjacent refactors "while here" without approval
- Spec gaps: ask if blocking, else `Assuming: [behavior]. Proceeding unless you object.`
- Respect project constraints; surface conflicts rather than silently violate
- If test infrastructure exists and tests are warranted, ask to add them; when approved, prefer test-first
- Flag design concerns: `Design concern: [issue]. Implementing as specified, but [risk].`

## Workflow

- Plan with the `update_plan` tool for multi-file changes; skip for well-specified single-file fixes
- For complex tasks, keep a short checklist in the plan and update it as steps complete
- Prefer `rg` for search; avoid repeated slow globs
- Commit one logical unit per commit: `type(scope): description`

## Large Tasks

- For multi-file or extended work: break into verifiable checkpoints (3-5 max)
- Each checkpoint: run verification, summarize, continue unless failure

## Error Handling

- Fail fast; log what failed with relevant identifiers
- Validate at boundaries; trust internal code unless investigating failures
- Diagnose before proceeding when tests/builds break

## Risk Boundaries

Ask before: destructive operations (data deletion, destructive git), secrets handling, paid APIs, production actions, or any external network call not covered by the safe-to-proceed list below

Safe to proceed without asking: dependency installs, tests, builds, dev servers, localhost calls, and public package registry or official docs network calls needed for the task
If unsure, ask

## Reversibility

- Prefer easily-rolled-back changes
- Flag irreversible actions (migrations, deletions) with rollback plan

## Auditability

- End of non-trivial tasks: summarize assumptions, commands, files touched

## Improvement

- Note friction in session; human decides whether to update AGENTS.md

## Task Completion

Announce non-trivial task completion explicitly in the final response (1-2 sentences). Skip for quick lookups.
