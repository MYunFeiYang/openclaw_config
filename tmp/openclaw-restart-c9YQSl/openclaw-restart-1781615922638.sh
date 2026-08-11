#!/bin/sh
# Standalone restart script — survives parent process termination.
# Wait briefly to ensure file locks are released after update.
sleep 1
# Capture launchctl output so bootstrap/kickstart failures leave a durable
# audit trail. Log setup is best-effort: restart must still run if the log path
# is temporarily unavailable.
if mkdir -p '/Users/thinkway/.openclaw/logs' 2>/dev/null && : >>'/Users/thinkway/.openclaw/logs/gateway-restart.log' 2>/dev/null; then
  exec >>'/Users/thinkway/.openclaw/logs/gateway-restart.log' 2>&1
fi
printf '[%s] openclaw restart attempt source=update target=%s\n' "$(date -u +%FT%TZ)" 'ai.openclaw.gateway' >&2
# Try kickstart first (works when the service is still registered).
# If it fails (e.g. after bootout), clear any persisted disabled state,
# then re-register via bootstrap. Bootstrap loads RunAtLoad agents, so the
# fallback must not immediately kickstart -k the freshly spawned gateway.
# The final status is captured
# before self-cleanup so a genuine failure remains observable.
status=0
if ! launchctl kickstart -k 'gui/501/ai.openclaw.gateway'; then
  launchctl enable 'gui/501/ai.openclaw.gateway'
  if launchctl bootstrap 'gui/501' '/Users/thinkway/Library/LaunchAgents/ai.openclaw.gateway.plist'; then
    status=0
  else
    launchctl kickstart -k 'gui/501/ai.openclaw.gateway'
    status=$?
  fi
fi
if [ "$status" -eq 0 ]; then
  printf '[%s] openclaw restart done source=update\n' "$(date -u +%FT%TZ)" >&2
else
  printf '[%s] openclaw restart failed source=update status=%s\n' "$(date -u +%FT%TZ)" "$status" >&2
fi
# Self-cleanup (log is retained under the OpenClaw state logs directory).
script_dir=$(dirname "$0")
rm -f "$0"
rmdir "$script_dir" 2>/dev/null || true
exit "$status"
