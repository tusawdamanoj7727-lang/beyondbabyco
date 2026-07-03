#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
PID_FILE="$ROOT/.pids/comfyui.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "ComfyUI is not running (no PID file)."
  exit 0
fi

PID="$(cat "$PID_FILE")"
if kill -0 "$PID" 2>/dev/null; then
  echo "==> Stopping ComfyUI (PID $PID)..."
  kill "$PID" 2>/dev/null || true
  sleep 1
  if kill -0 "$PID" 2>/dev/null; then
    kill -9 "$PID" 2>/dev/null || true
  fi
  echo "✓ ComfyUI stopped."
else
  echo "ComfyUI process not found (stale PID $PID)."
fi

rm -f "$PID_FILE"
