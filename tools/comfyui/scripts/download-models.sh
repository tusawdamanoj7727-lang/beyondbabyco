#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
MODELS="$ROOT/tools/comfyui/models"
CHECKPOINTS="$MODELS/checkpoints"
CLIP="$MODELS/clip"
VAE="$MODELS/vae"
DIFFUSION="$MODELS/diffusion_models"

FLUX_MODEL="${FLUX_MODEL:-flux1-schnell}"

echo "==> BeyondBabyCo — FLUX model download"
echo "    FLUX_MODEL=$FLUX_MODEL"

download() {
  local url="$1"
  local dest="$2"
  if [[ -f "$dest" ]]; then
    echo "    ✓ exists: $(basename "$dest")"
    return 0
  fi
  echo "    ↓ downloading: $(basename "$dest")"
  mkdir -p "$(dirname "$dest")"
  if command -v curl >/dev/null; then
    curl -L --fail --progress-bar -o "$dest" "$url"
  elif command -v wget >/dev/null; then
    wget -O "$dest" "$url"
  else
    echo "Error: curl or wget required."
    exit 1
  fi
}

mkdir -p "$CHECKPOINTS" "$CLIP" "$VAE" "$DIFFUSION"

# --- FLUX.1 Schnell (main diffusion model) ---
if [[ "$FLUX_MODEL" == "flux1-schnell-fp8" ]]; then
  FLUX_FILE="flux1-schnell-fp8.safetensors"
  FLUX_URL="https://huggingface.co/Comfy-Org/flux1-schnell/resolve/main/flux1-schnell-fp8.safetensors"
else
  FLUX_FILE="flux1-schnell.safetensors"
  FLUX_URL="https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/flux1-schnell.safetensors"
fi

download "$FLUX_URL" "$CHECKPOINTS/$FLUX_FILE"

# ComfyUI UNETLoader reads diffusion_models — symlink from checkpoints
if [[ ! -f "$DIFFUSION/$FLUX_FILE" ]]; then
  ln -sf "../checkpoints/$FLUX_FILE" "$DIFFUSION/$FLUX_FILE"
  echo "    ✓ linked $FLUX_FILE → diffusion_models/"
fi

# --- Text encoders (required for FLUX) ---
download \
  "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/clip_l.safetensors" \
  "$CLIP/clip_l.safetensors"

download \
  "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp16.safetensors" \
  "$CLIP/t5xxl_fp16.safetensors"

# fp8 T5 variant for lower VRAM (optional — uncomment to use)
# download \
#   "https://huggingface.co/comfyanonymous/flux_text_encoders/resolve/main/t5xxl_fp8_e4m3fn.safetensors" \
#   "$CLIP/t5xxl_fp8_e4m3fn.safetensors"

# --- VAE ---
download \
  "https://huggingface.co/black-forest-labs/FLUX.1-schnell/resolve/main/ae.safetensors" \
  "$VAE/ae.safetensors"

echo ""
echo "✓ Model files ready under tools/comfyui/models/"
echo ""
echo "Required files:"
echo "  checkpoints/$FLUX_FILE"
echo "  clip/clip_l.safetensors"
echo "  clip/t5xxl_fp16.safetensors"
echo "  vae/ae.safetensors"
echo ""
echo "Set FLUX_MODEL=$FLUX_MODEL in .env.local if using a non-default checkpoint."
echo "Run: npm run ai:start && npm run ai:generate -- --prompt \"test baby product photo\""
