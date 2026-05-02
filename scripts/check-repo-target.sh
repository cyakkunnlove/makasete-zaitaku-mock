#!/usr/bin/env bash
set -euo pipefail

expected_root="/Users/takuyakatou/clawd/projects/makasete-zaitaku/app"
expected_remote="https://github.com/cyakkunnlove/makasete-zaitaku-mock.git"

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
remote_url="$(git remote get-url origin 2>/dev/null || true)"
branch="$(git branch --show-current 2>/dev/null || true)"

if [[ "$repo_root" != "$expected_root" ]]; then
  echo "ERROR: wrong repository root: $repo_root" >&2
  echo "Expected: $expected_root" >&2
  exit 1
fi

if [[ "$remote_url" != "$expected_remote" ]]; then
  echo "ERROR: wrong origin remote: $remote_url" >&2
  echo "Expected: $expected_remote" >&2
  exit 1
fi

if [[ "$branch" != "main" ]]; then
  echo "ERROR: wrong branch: $branch" >&2
  echo "Expected: main" >&2
  exit 1
fi

echo "OK: production app repo target confirmed"
echo "root:   $repo_root"
echo "remote: $remote_url"
echo "branch: $branch"
