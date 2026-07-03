#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
COMFY_ROOT="$ROOT/tools/comfyui"
COMFY_DIR="$COMFY_ROOT/ComfyUI"
VENV="$COMFY_ROOT/venv"
PID_FILE="$ROOT/.pids/comfyui.pid"
LOG_FILE="$ROOT/.pids/comfyui.log"
HOST="${COMFYUI_HOST:-127.0.0.1}"
PORT="${COMFYUI_PORT:-8188}"

PYTHON="$VENV/bin/python"
if [[ ! -x "$PYTHON" ]]; then
  echo "Error: ComfyUI venv not found. Run: npm run ai:install"
  exit 1
fi

if [[ ! -d "$COMFY_DIR" ]]; then
  echo "Error: ComfyUI not installed. Run: npm run ai:install"
  exit 1
fi

mkdir -p "$ROOT/.pids"

if [[ -f "$PID_FILE" ]]; then
  OLD_PID="$(cat "$PID_FILE")"
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "ComfyUI already running (PID $OLD_PID) at http://$HOST:$PORT"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

echo "==> Starting ComfyUI on http://$HOST:$PORT"
echo "    Log: $LOG_FILE"

CPU_FLAG=""
if [[ "${COMFYUI_CPU:-}" == "1" ]] || [[ "${COMFYUI_CPU:-auto}" == "auto" && "$(uname -s)" == "Darwin" ]]; then
  CPU_FLAG="--cpu"
  echo "    Device: CPU (macOS FLUX bfloat16/MPS workaround; set COMFYUI_CPU=0 to force MPS)"
fi

cd "$COMFY_DIR"
nohup "$PYTHON" main.py \
  --listen "$HOST" \
  --port "$PORT" \
  $CPU_FLAG \
  --extra-model-paths-config "$COMFY_ROOT/extra_model_paths.yaml" \
  >>"$LOG_FILE" 2>&1 &

echo $! >"$PID_FILE"
sleep 2

if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "✓ ComfyUI started (PID $(cat "$PID_FILE"))"
  echo "  Health: npm run ai:health"
else
  echo "✗ ComfyUI failed to start. Check $LOG_FILE"
  exit 1
fi
