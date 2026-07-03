#!/usr/bin/env python3
"""Resume-safe FLUX model downloads via huggingface_hub."""

from __future__ import annotations

import os
import sys
from pathlib import Path

from huggingface_hub import hf_hub_download

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "tools" / "comfyui" / "models"

# Minimum complete sizes (bytes) — skip re-download when file is large enough.
MIN_BYTES = {
    "flux1-schnell-fp8.safetensors": 17_000_000_000,
    "clip_l.safetensors": 240_000_000,
    "t5xxl_fp16.safetensors": 9_700_000_000,
    "ae.safetensors": 330_000_000,
}

DOWNLOADS = [
    {
        "repo_id": "Comfy-Org/flux1-schnell",
        "filename": "flux1-schnell-fp8.safetensors",
        "dest": MODELS / "checkpoints" / "flux1-schnell-fp8.safetensors",
    },
    {
        "repo_id": "comfyanonymous/flux_text_encoders",
        "filename": "clip_l.safetensors",
        "dest": MODELS / "clip" / "clip_l.safetensors",
    },
    {
        "repo_id": "comfyanonymous/flux_text_encoders",
        "filename": "t5xxl_fp16.safetensors",
        "dest": MODELS / "clip" / "t5xxl_fp16.safetensors",
    },
    {
        "repo_id": "Comfy-Org/Lumina_Image_2.0_Repackaged",
        "filename": "split_files/vae/ae.safetensors",
        "dest": MODELS / "vae" / "ae.safetensors",
    },
]


def download_one(item: dict) -> None:
    dest: Path = item["dest"]
    dest.parent.mkdir(parents=True, exist_ok=True)
    min_size = MIN_BYTES.get(dest.name, 0)
    if dest.exists() and dest.stat().st_size >= min_size:
        mb = dest.stat().st_size / (1024 * 1024)
        print(f"  ✓ exists: {dest.name} ({mb:.0f} MB)")
        return

    if dest.exists() and dest.stat().st_size < min_size:
        print(f"  ↻ resuming incomplete: {dest.name}")
        dest.unlink()

    print(f"  ↓ downloading: {dest.name}")
    cached = hf_hub_download(
        repo_id=item["repo_id"],
        filename=item["filename"],
        local_dir=str(dest.parent),
    )
    cached_path = Path(cached)
    if cached_path.resolve() != dest.resolve():
        if dest.exists():
            dest.unlink()
        if not cached_path.exists():
            # Nested path from split_files repos (e.g. Lumina VAE pack).
            nested = dest.parent / item["filename"]
            if nested.exists():
                cached_path = nested
            else:
                raise FileNotFoundError(f"Download missing: {cached}")
        dest.parent.mkdir(parents=True, exist_ok=True)
        cached_path.rename(dest)
    mb = dest.stat().st_size / (1024 * 1024)
    print(f"  ✓ {dest.name} ({mb:.0f} MB)")


def main() -> int:
    print("==> FLUX models (huggingface_hub resume)")
    for item in DOWNLOADS:
        try:
            download_one(item)
        except Exception as exc:  # noqa: BLE001
            print(f"  ✗ {item['dest'].name}: {exc}", file=sys.stderr)
            return 1

    diffusion = MODELS / "diffusion_models" / "flux1-schnell-fp8.safetensors"
    target = MODELS / "checkpoints" / "flux1-schnell-fp8.safetensors"
    diffusion.parent.mkdir(parents=True, exist_ok=True)
    if not diffusion.exists() and target.exists():
        os.symlink("../checkpoints/flux1-schnell-fp8.safetensors", diffusion)

    print("\n✓ All FLUX models ready")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
