#!/usr/bin/env bash
# Used as LaunchAgent ProgramArguments[0]: sources ~/.openclaw/.env then execs OpenClaw gateway (remaining argv).
set -euo pipefail
OC_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"
if [[ -f "$OC_HOME/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$OC_HOME/.env"
  set +a
fi
exec "$@"
