#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PID_FILE="$ROOT/.pids/comfyui.pid"
URL="${COMFYUI_URL:-http://127.0.0.1:8188}"

if [[ -f "$PID_FILE" ]]; then
  PID="$(cat "$PID_FILE")"
  if kill -0 "$PID" 2>/dev/null; then
    echo "ComfyUI: running (PID $PID)"
  else
    echo "ComfyUI: not running (stale PID $PID)"
  fi
else
  echo "ComfyUI: not running"
fi

if command -v curl >/dev/null; then
  if curl -sf --max-time 3 "$URL/system_stats" >/dev/null; then
    echo "API:     reachable at $URL"
  else
    echo "API:     unreachable at $URL"
  fi
fi
