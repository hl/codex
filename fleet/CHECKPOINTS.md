# Fleet checkpoint contract

Every durable pipeline transition is an append-only Bead comment using this exact field set. The stage owner writes it and confirms it through a separate read before reporting completion. Older checkpoints remain history. The latest valid checkpoint is determined by Beads' durable comment sequence/order (and comment id when exposed), never by an agent-authored timestamp. If the read path cannot establish a unique last comment, stop and have Mira append a reconciled checkpoint.

```text
FLEET_CHECKPOINT v1
checkpoint_id: <globally unique UUID>
bead: <bead-id>
stage: <plan|work|review|rework|land|reconcile>
status: <active|blocked|ready|changes|approved|landed|abandoned>
actor: <role and agent name>
workspace: <Herdr workspace name or n/a>
worktree: <absolute worktree path or n/a>
branch: <branch or n/a>
base_sha: <full SHA or n/a>
head_sha: <full SHA or n/a>
pr: <URL or n/a>
review_round: <integer>
completed: <JSON array of completed facts>
verification: <JSON array of exact command/outcome facts>
next_action: <one concrete action or none>
blocker: <exact blocker or none>
updated_at: <RFC3339 UTC timestamp, informational only>
```

Use single-line values and valid JSON arrays for `completed` and `verification`. Never put secrets, full pane transcripts, or speculative state in a checkpoint. Write immediately after claim and before the first edit, after every meaningful phase or changed assumption, before crash-prone or long-running operations, and at every handoff, verdict, rework, landing, or abandonment. If exact data is unavailable, write `n/a`; do not omit fields or guess.

Stage ownership is explicit: Odessa writes `plan`; Jules writes `work`, `rework`, and `land`; Mira writes `reconcile` and may mechanically record a supplied review verdict as `review`. Pien and Rasma never write Beads. After a crash, a replacement agent starts from the latest valid checkpoint, verifies its claims against the checkout and external state, and appends a corrective checkpoint rather than editing history.
