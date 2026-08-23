unalias pien 2>/dev/null || true

pien() {
  "${CODEX_HOME:-$HOME/.codex}/fleet/bin/pien" "$@"
}
