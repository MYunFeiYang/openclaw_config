#!/usr/bin/env bash
# Source ~/.openclaw/.env then run openclaw, so SecretRef env vars resolve when
# the gateway/service does not auto-load .env. Usage: alias openclaw='.../openclaw-with-dotenv.sh'
set -euo pipefail
OC_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"
if [[ -f "$OC_HOME/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$OC_HOME/.env"
  set +a
fi
exec openclaw "$@"
