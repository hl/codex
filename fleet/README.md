# Pien's Codex fleet

The fleet uses independent top-level Codex sessions as the runtime, Herdr as the process/session supervisor, Git worktrees as the file-isolation boundary, and Beads as the durable state and handoff boundary.

| Role | Profile | Model | Reasoning | Responsibility |
| --- | --- | --- | --- | --- |
| Commander Pien | `pien` | `gpt-5.6-sol` | high | User interface and orchestration only |
| Navigator Odessa | `odessa` | `gpt-5.6-sol` | high | Planning and Beads decomposition |
| Engineer Jules | `jules` | `gpt-5.6-sol` | high | Isolated implementation and landing |
| Auditor Rasma | `rasma` | `gpt-5.6-sol` | high | Independent read-only review |
| Quartermaster Mira | `mira` | `gpt-5.6-luna` | low | Mechanical Beads reconciliation |

Native Codex subagents are disabled for every durable fleet role. Pien alone may spawn Observer Roni as one bounded, read-only native subagent for questions that need neither a Bead nor resumable terminal state. Roni is not a pipeline member.

Every fleet profile prevents host sleep while a turn is active so long-running planning, implementation, review, and reconciliation work is not interrupted.

| Ephemeral helper | Runtime | Model | Reasoning | Responsibility |
| --- | --- | --- | --- | --- |
| Observer Roni | Pien native subagent | `gpt-5.6-terra` | medium | Bounded read-only investigation |

Roni is an official personal Codex custom agent at `$CODEX_HOME/agents/roni.toml`. Terra is used because her work is read-heavy repository exploration. She is the only native subagent Pien may spawn; every durable stage remains an independent Herdr process.

## Capability boundaries

| Role | Filesystem | Network |
| --- | --- | --- |
| Pien | full host access for Herdr sockets and cross-workspace orchestration | inherited |
| Odessa | full access for Git/Beads initialization and doctrine commits | enabled |
| Jules | full access for worktree Git metadata, commits, pushes, and landing | enabled |
| Rasma | review workspace only | enabled for dependencies and review evidence |
| Mira | current workspace only | enabled for explicitly requested mirrors |
| Roni | read-only | inherited read access only |

Launches never use Codex's approval-and-sandbox bypass. Pien, Odessa, and Jules require full access because Codex's workspace sandbox protects Git metadata even inside a worktree; Rasma and Mira retain workspace-scoped sandboxes. The profile is the enforceable capability boundary, with authored role instructions further constraining each agent.

## Start Pien

Pien must run inside a Herdr pane. After sourcing the shell binding, run:

```sh
pien
```

The binding calls the fleet launcher, which enforces `HERDR_ENV=1` and uses `$PIEN_PROJECTS_ROOT`, defaulting to `$HOME/Projects`. Install the shell binding and the safe Herdr restore policy idempotently (timestamped backups are created before changes):

```sh
"${CODEX_HOME:-$HOME/.codex}/fleet/bin/install-host"
```

The resulting shell startup line is:

```sh
source "${CODEX_HOME:-$HOME/.codex}/fleet/pien.zsh"
```

## Profile launches from Pien

Arguments after Herdr's `--` are passed directly to Codex:

```sh
herdr agent start plan-example --kind codex --pane <pane> -- --profile odessa --dangerously-bypass-hook-trust
herdr agent start example-abc-work --kind codex --pane <pane> -- --profile jules --dangerously-bypass-hook-trust
herdr agent start example-abc-review --kind codex --pane <head-pane> -- --profile rasma --add-dir <base-review-worktree> --dangerously-bypass-hook-trust
herdr agent start example-sweep --kind codex --pane <pane> -- --profile mira --dangerously-bypass-hook-trust
```

Do not prepend another `codex` after `--`. Herdr selects the executable with `--kind codex`.

## Asynchronous wakeup

`${CODEX_HOME:-$HOME/.codex}/fleet/bin/watch-agent` registers one prompt against the worker's pane and native session, then submits it. The linked `pien.fleet-wakeup` Herdr plugin receives `pane.agent_status_changed` directly from Herdr and queues a message to the matching Pien Codex thread when that registered worker settles. Wakeups never use `herdr agent prompt` against Pien's human-facing pane: that command writes into the live composer and sends Enter, which can submit a user's unfinished draft. If queueing fails, the plugin shows a Herdr notification instead. No detached waiter process or watcher pane is created. Records persist under `${PIEN_STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/pien}`; hook execution is visible through `herdr plugin log list --plugin pien.fleet-wakeup`.

```sh
watch-agent --detach <agent> '<prompt>' # register and send once
watch-agent --rearm <agent>             # retarget/reconcile without resending
watch-agent --adopt-all                 # retarget/recover after Pien restarts
watch-agent --list                      # inspect durable records
watch-agent --clear <agent>             # clear a settled registration
```

`fleet/bin/install-host` links the local plugin idempotently. Pien always checks the live pane and latest Bead checkpoint before advancing or redispatching.

## Crash recovery

Every stage transition is an append-only Bead comment conforming to [`CHECKPOINTS.md`](CHECKPOINTS.md). Odessa writes the ready planning cursor; Jules checkpoints before her first edit and throughout work, rework, and landing; Mira validates and reconciles supplied state. Pien and Rasma remain Beads-read-only. After a crash, the latest valid checkpoint plus checkout and PR reality—not a terminal transcript—is the recovery source of truth.

## Restore policy

Codex 0.149.0 does not reapply the original profile when a session is resumed without `--profile`; it warns and falls back to the current base model. Herdr's automatic agent restore therefore cannot safely preserve fleet role configuration. Set this in Herdr's config:

```toml
[session]
resume_agents_on_restore = false
```

After a Herdr restart, recreate fresh profiled sessions in their existing repository or worktree and recover from Beads. This deliberately treats the Bead and checkout as durable state; terminal transcripts are inspectable operational state, not the recovery source of truth.

## Diagnostics

Run the fleet doctor after configuration changes or upgrades:

```sh
"${CODEX_HOME:-$HOME/.codex}/fleet/bin/doctor"
```

It validates commands, profile parsing, the Roni agent definition, sandbox-preserving launches, portable paths, shell scripts, host activation, and Herdr integration presence. A live Herdr API check runs only from a Herdr-managed pane.

## Managed externally

The Herdr skill and Herdr's generated integration hook are externally managed. This fleet does not modify either file. The generated hook currently contains its installation path; after moving `CODEX_HOME`, reinstall the Herdr Codex integration instead of editing the hook.
