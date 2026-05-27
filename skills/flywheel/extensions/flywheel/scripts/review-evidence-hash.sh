#!/usr/bin/env bash
# Compute the review evidence hash used by Flywheel review and compound.
#
# Usage: review-evidence-hash.sh <BASE>
# Output: sha256 hex digest on stdout, followed by a newline.
#
# Inputs hashed, in this order:
#   1. git diff <BASE>...HEAD, canonicalized as described below
#   2. git diff --cached, canonicalized as described below
#   3. git diff, canonicalized as described below
#   4. for each untracked file (locale-stable sort): a header line,
#      Git-relevant metadata, and file contents or symlink target, ignoring the
#      self-referential last_review_diff_hash line.
#
# The byte-exact format is part of the contract. Review and compound must both invoke this
# script so the digests are directly comparable.

set -euo pipefail

BASE="${1:?usage: review-evidence-hash.sh <BASE>}"

cd "$(git rev-parse --show-toplevel)"

canonicalize_diff() {
  sed -E \
    -e '/^[+-]?last_review_diff_hash:/d' \
    -e '/^index [0-9a-f]+\.\.[0-9a-f]+( [0-9]+)?$/d'
}

canonicalize_file_content() {
  sed -E '/^last_review_diff_hash:/d'
}

{
  git diff "$BASE"...HEAD | canonicalize_diff
  git diff --cached | canonicalize_diff
  git diff | canonicalize_diff
  git ls-files --others --exclude-standard -z | LC_ALL=C sort -z | while IFS= read -r -d '' f; do
    printf '\n--- untracked: %s ---\n' "$f"
    if [ -L "$f" ]; then
      printf 'mode: 120000\n'
      printf 'link: %s\n' "$(readlink "$f")"
    elif [ -f "$f" ]; then
      if [ -x "$f" ]; then
        printf 'mode: 100755\n'
      else
        printf 'mode: 100644\n'
      fi
      printf 'content:\n'
      canonicalize_file_content < "$f"
    else
      printf 'mode: other\n'
    fi
  done
} | shasum -a 256 | awk '{print $1}'
