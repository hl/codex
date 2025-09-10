# Personal LLM Collaboration Guide

Purpose: Machine-readable instructions for the agent working in this repo.
Scope: Repo-wide unless overridden by nested `AGENTS.md` files.
Precedence: Direct user/developer prompts override this file.

## Core Principles

- Personal rule: No placeholder code
  - Do not add stubs, TODO/FIXME, or NotImplementedError-style placeholders
  - Implement functions fully; avoid hardcoded dummy values
  - If requirements are unclear, ask before adding code
- Ask before destructive or irreversible actions
  - Examples: deleting/moving many files, `git reset`/history changes, schema/data migrations, dependency installs, network access, long-running tasks (> ~2 min), writing outside the workspace
- Minimal diffs and tight scope
  - Change only what’s necessary; don’t refactor unrelated code
  - Keep naming/style consistent with the existing codebase
- State assumptions explicitly
  - When uncertain, list assumptions and what you’ll do under them

## Communication Protocol

- Use Bloom’s protocol for analysis/design/debugging tasks
  - Output ordered, succinct bullets labeled: Remember, Understand, Apply, Analyze, Evaluate, Create
  - Include only levels that add value; keep order if levels are skipped
  - Trivial tasks can skip Bloom; non-trivial tasks should include it briefly
- When uncertain or there are multiple approaches
  - List options with trade-offs, recommend one, and pause for confirmation unless clearly trivial

Example Bloom outline (generic):

- Remember: Constraints, files/paths to touch, required interfaces
- Understand: Restate the goal and success criteria
- Apply: Map tasks to specific files/modules/commands
- Analyze: Compare approaches; note risks and rationale
- Evaluate: Define validation steps and acceptance checks
- Create: Actionable, ordered steps you’ll take next

## Output Preferences

- Be concise; prefer short bullet lists
- Show exact file paths, commands, and identifiers in backticks
- Before editing, state intent and scope; after editing, summarize what changed and why
- Do not dump large file contents; reference paths unless I ask
- Avoid heavy formatting unless requested

## Validation Preferences

- Propose validation steps up front
  - Start with targeted checks (unit tests for changed modules), then broader suites
  - If local validation isn’t possible, provide exact commands for me to run
- Do not install dependencies or use the network without explicit approval

## Codex-Specific Conventions

- Use `update_plan` for multi-step work; maintain exactly one `in_progress` step
- Provide a brief preamble before grouped tool calls; keep it to one or two sentences
- Use `apply_patch` for edits; keep patches small and focused; don’t mix unrelated changes
- Prefer `rg` for searching and read files in <= 250-line chunks
- Respect sandbox/approval settings; ask when elevated privileges or destructive actions are needed

## Tool Preferences (Advisory)

- Capability-first: specify the desired capability, then a preferred tool, then a fallback.
- Non-binding: treat tool names as preferences, not requirements; do not block work if unavailable.
- Detect before use: check tool availability; do not install or use network without explicit approval.
- Search capability: prefer `rg`; if unavailable, use `grep -R` with equivalent flags.
- Patch/diff capability: prefer `apply_patch`; if unavailable, output a unified diff in the expected patch format.
- Planning capability: prefer `update_plan`; if unavailable, include a concise inline step list with exactly one active step.
- Output limits: keep file reads to <= 250 lines per chunk; if tools vary, approximate this behavior.
- Last reviewed: 2025-09-10.

## Commits (only when I ask)

- Do not commit or push unless I explicitly request it
- If I ask you to craft a commit
  - Use Conventional Commits style
  - For multi-line messages, write to a file and use `git commit -F <file>`
  - Include a concise rationale and link issue/PR numbers when provided
