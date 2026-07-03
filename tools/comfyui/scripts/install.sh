#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
COMFY_ROOT="$ROOT/tools/comfyui"
COMFY_DIR="$COMFY_ROOT/ComfyUI"
VENV="$COMFY_ROOT/venv"

echo "==> BeyondBabyCo — ComfyUI install"
echo "    Project: $ROOT"
echo "    Target:  $COMFY_DIR"

find_python() {
  if [[ -n "${PYTHON:-}" ]] && "$PYTHON" -c 'import sys; exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then
    echo "$PYTHON"
    return 0
  fi
  for candidate in python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then
      if "$candidate" -c 'import sys; exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then
        echo "$(command -v "$candidate")"
        return 0
      fi
    fi
  done
  return 1
}

PYTHON_BIN="$(find_python || true)"
if [[ -z "$PYTHON_BIN" ]]; then
  echo "Error: Python 3.10+ is required (ComfyUI dependency av>=16 needs 3.10+)."
  echo ""
  echo "Your system python3 is too old. Install Python 3.10+ then re-run:"
  echo "  brew install python@3.12"
  echo "  PYTHON=\$(brew --prefix python@3.12)/bin/python3.12 npm run ai:install"
  echo ""
  echo "Or set PYTHON to any 3.10+ interpreter:"
  echo "  PYTHON=/path/to/python3.12 npm run ai:install"
  exit 1
fi

PY_VERSION="$("$PYTHON_BIN" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
echo "    Python:  $PY_VERSION ($PYTHON_BIN)"

mkdir -p "$COMFY_ROOT/models/checkpoints" \
         "$COMFY_ROOT/models/clip" \
         "$COMFY_ROOT/models/vae" \
         "$COMFY_ROOT/models/diffusion_models" \
         "$COMFY_ROOT/models/unet" \
         "$ROOT/.pids"

if [[ ! -d "$COMFY_DIR/.git" ]]; then
  echo "==> Cloning ComfyUI..."
  git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git "$COMFY_DIR"
else
  echo "==> ComfyUI already cloned — pulling latest..."
  git -C "$COMFY_DIR" pull --ff-only || echo "    (pull skipped)"
fi

if [[ ! -d "$VENV" ]]; then
  echo "==> Creating Python virtualenv..."
  "$PYTHON_BIN" -m venv "$VENV"
fi

echo "==> Installing Python dependencies..."
# shellcheck disable=SC1091
source "$VENV/bin/activate"
pip install --upgrade pip wheel
# comfy-angle is optional (GLSL nodes) and not on standard PyPI for all platforms
grep -v '^comfy-angle' "$COMFY_DIR/requirements.txt" | pip install -r /dev/stdin
pip install "numpy<2" "scipy<1.14"
pip install comfy-angle --extra-index-url https://nodes.appmana.com/simple/ 2>/dev/null \
  || echo "    (optional comfy-angle skipped — FLUX generation still works)"

echo "==> Linking model directories for ComfyUI..."
for sub in checkpoints clip vae diffusion_models unet; do
  mkdir -p "$COMFY_DIR/models/$sub"
done

echo ""
echo "✓ ComfyUI installed."
echo ""
echo "Next steps:"
echo "  1. npm run ai:models     # Download FLUX.1 Schnell + text encoders + VAE"
echo "  2. npm run ai:start      # Start ComfyUI on http://127.0.0.1:8188"
echo "  3. npm run ai:health     # Verify the API is reachable"
echo ""
echo "See docs/LOCAL_AI_SETUP.md for full instructions."
