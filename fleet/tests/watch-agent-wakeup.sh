#!/bin/sh
set -eu

test_root=$(mktemp -d "${TMPDIR:-/tmp}/watch-agent-wakeup.XXXXXX")
trap 'rm -rf "$test_root"' EXIT HUP INT TERM

fake_bin=$test_root/bin
state_dir=$test_root/state
call_log=$test_root/calls.log
mkdir -p "$fake_bin" "$state_dir/watches"
: >"$call_log"

cat >"$fake_bin/herdr" <<'EOF'
#!/bin/sh
printf 'herdr' >>"$TEST_CALL_LOG"
printf ' %s' "$@" >>"$TEST_CALL_LOG"
printf '\n' >>"$TEST_CALL_LOG"

if [ "${1:-}" = agent ] && [ "${2:-}" = get ]; then
  if [ "${3:-}" = pien ]; then
    printf '%s\n' '{"result":{"agent":{"name":"pien","agent_session":{"value":"controller-thread"},"agent_status":"idle","pane_id":"controller-pane"}}}'
  else
    printf '%s\n' '{"result":{"agent":{"name":"worker","agent_session":{"value":"worker-session"},"agent_status":"done","pane_id":"worker-pane"}}}'
  fi
  exit 0
fi

if [ "${1:-}" = agent ] && [ "${2:-}" = prompt ]; then
  exit 0
fi

if [ "${1:-}" = notification ] && [ "${2:-}" = show ]; then
  exit 0
fi

exit 1
EOF

cat >"$fake_bin/codex" <<'EOF'
#!/bin/sh
printf 'codex' >>"$TEST_CALL_LOG"
printf ' %s' "$@" >>"$TEST_CALL_LOG"
printf '\n' >>"$TEST_CALL_LOG"
[ "${1:-}" = queue ]
EOF

chmod +x "$fake_bin/herdr" "$fake_bin/codex"

cat >"$state_dir/watches/worker.json" <<'EOF'
{
  "version": 2,
  "agent": "worker",
  "state": "running",
  "generation": "test-generation",
  "pane_id": "worker-pane",
  "agent_session": "worker-session",
  "target_thread": "controller-thread",
  "last_status": "working"
}
EOF

script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
PATH="$fake_bin:$PATH" \
  PIEN_STATE_DIR="$state_dir" \
  TEST_CALL_LOG="$call_log" \
  HERDR_PLUGIN_EVENT=pane.agent_status_changed \
  HERDR_PLUGIN_EVENT_JSON='{"data":{"pane_id":"worker-pane","agent_status":"done"}}' \
  "$script_dir/../bin/watch-agent" --plugin-event

jq -e '.state == "queued" and .wake_method == "codex_queue" and .notified_thread == "controller-thread"' \
  "$state_dir/watches/worker.json" >/dev/null
grep -q '^codex queue --thread controller-thread --message Herdr agent worker settled with status done\.' "$call_log"
if grep -q '^herdr agent prompt pien ' "$call_log"; then
  printf '%s\n' 'watch-agent wrote a wakeup into Pien terminal input' >&2
  exit 1
fi
