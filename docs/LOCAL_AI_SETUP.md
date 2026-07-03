# Local AI Image Generation — BeyondBabyCo

Developer-only tooling for generating brand assets with **ComfyUI** and **FLUX.1 Schnell**. This setup is isolated from the Next.js app and is **not exposed to customers**.

## Quick start

```bash
# 1. Install ComfyUI (Python 3.10+ required)
npm run ai:install

# 2. Download FLUX models (~15–20 GB total)
npm run ai:models

# 3. Start ComfyUI (http://127.0.0.1:8188)
npm run ai:start

# 4. Verify API
npm run ai:health

# 5. Start Next.js (separate terminal)
npm run dev

# 6. Open the dev UI
open http://localhost:3000/dev/ai
```

## Architecture

```
tools/comfyui/
├── ComfyUI/              # Git clone (not committed)
├── venv/                 # Python virtualenv (not committed)
├── models/
│   ├── checkpoints/      # FLUX.1 Schnell weights (primary storage)
│   ├── diffusion_models/ # Symlink → checkpoints (ComfyUI UNETLoader)
│   ├── clip/             # clip_l + t5xxl text encoders
│   └── vae/              # ae.safetensors
├── workflows/
│   └── flux-schnell.json
├── scripts/
│   ├── install.sh
│   ├── download-models.sh
│   ├── start.sh
│   └── stop.sh
└── extra_model_paths.yaml

public/images/generated/
├── hero/
├── products/
├── lifestyle/
├── ingredients/
├── marketing/
├── blog/
└── temporary/

src/lib/ai/               # TypeScript helper library
src/app/api/dev/          # Dev-only API routes
src/app/dev/ai/           # Dev-only UI
```

## Dependencies

| Requirement | Notes |
|-------------|-------|
| **Python 3.10+** | Used by ComfyUI |
| **git** | Clone ComfyUI |
| **curl or wget** | Model downloads |
| **16 GB+ RAM** | Minimum for FLUX fp16 |
| **Apple Silicon / NVIDIA GPU** | Strongly recommended; CPU works but is very slow |

ComfyUI Python packages are installed into `tools/comfyui/venv` via `install.sh`.

## Model files

Downloaded by `npm run ai:models`:

| File | Location | Purpose |
|------|----------|---------|
| `flux1-schnell.safetensors` | `models/checkpoints/` | Main diffusion model (fp16) |
| `clip_l.safetensors` | `models/clip/` | CLIP text encoder |
| `t5xxl_fp16.safetensors` | `models/clip/` | T5 text encoder |
| `ae.safetensors` | `models/vae/` | FLUX VAE |

### fp8 vs fp16

- **fp16 (default):** `FLUX_MODEL=flux1-schnell` — best quality, needs more VRAM (~12 GB+)
- **fp8 (lower VRAM):** `FLUX_MODEL=flux1-schnell-fp8` — run `FLUX_MODEL=flux1-schnell-fp8 npm run ai:models`

```bash
# .env.local
AI_PROVIDER=local
COMFYUI_URL=http://127.0.0.1:8188
FLUX_MODEL=flux1-schnell
```

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run ai:install` | Clone ComfyUI + create Python venv |
| `npm run ai:models` | Download FLUX + encoders + VAE |
| `npm run ai:start` | Start ComfyUI in background |
| `npm run ai:stop` | Stop ComfyUI |
| `npm run ai:health` | Ping ComfyUI `/system_stats` |
| `npm run ai:generate` | CLI generation via Next.js dev API |

## Generating images

### Dev UI

Visit [http://localhost:3000/dev/ai](http://localhost:3000/dev/ai) (development only).

### API (dev only)

```http
POST /api/dev/generate-image
Content-Type: application/json

{
  "prompt": "Premium baby wipes product photo, soft cream background",
  "negativePrompt": "blurry, text, watermark",
  "width": 1024,
  "height": 1024,
  "seed": 42,
  "steps": 4,
  "category": "products",
  "filename": "wipes-hero.png"
}
```

Returns:

```json
{
  "ok": true,
  "result": {
    "localPath": "public/images/generated/products/wipes-hero.png",
    "publicPath": "/images/generated/products/wipes-hero.png",
    "seed": 42,
    "durationMs": 8500,
    "prompt": "..."
  }
}
```

**Production:** endpoints return `403` unless `AI_DEV_ENABLED=true` (not recommended).

### TypeScript helper

```typescript
import { generateImage } from "@/lib/ai/generateImage";

const result = await generateImage(
  "Soft lifestyle photo of baby care products on a nursery shelf",
  "lifestyle/nursery-shelf.png",
  { width: 1024, height: 1024, steps: 4, category: "lifestyle" },
);

console.log(result.publicPath); // /images/generated/lifestyle/nursery-shelf.png
```

### CLI

```bash
npm run dev   # terminal 1
npm run ai:start   # terminal 2

npm run ai:generate -- \
  --prompt "Minimal hero banner, green and cream, baby care brand" \
  --category hero \
  --filename homepage-hero.png
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `local` | Only `local` supported |
| `COMFYUI_URL` | `http://127.0.0.1:8188` | ComfyUI API base URL |
| `FLUX_MODEL` | `flux1-schnell` | Checkpoint name (without path) |
| `AI_DEV_ENABLED` | — | Set `true` to allow AI tools outside `NODE_ENV=development` |
| `AI_REQUEST_TIMEOUT_MS` | `120000` | HTTP timeout for generation |
| `COMFYUI_HOST` | `127.0.0.1` | Bind address for ComfyUI |
| `COMFYUI_PORT` | `8188` | ComfyUI port |

## Logging

Generation events are logged as structured JSON:

- `ai.generation.start` — prompt (truncated), seed, dimensions
- `ai.generation.success` — output path, duration
- `ai.generation.error` — error details (no secrets)
- `ai.health` — ComfyUI availability

## Troubleshooting

### ComfyUI won't start

```bash
cat .pids/comfyui.log
npm run ai:install   # re-run if venv is missing
```

### `COMFYUI_UNAVAILABLE`

```bash
npm run ai:start
npm run ai:health
```

### Model not found

Ensure files exist:

```bash
ls tools/comfyui/models/checkpoints/
ls tools/comfyui/models/clip/
ls tools/comfyui/models/vae/
ls -la tools/comfyui/models/diffusion_models/   # should symlink to checkpoints
```

Re-download: `npm run ai:models`

### Out of memory

- Use fp8: `FLUX_MODEL=flux1-schnell-fp8 npm run ai:models`
- Reduce resolution: `768×768` or `512×512`
- Close other GPU apps

### Intel Mac recommendations

- FLUX on Intel Mac runs on **CPU** — expect **several minutes per image**
- Use **fp8** weights and **512×512** for faster iteration
- Keep ComfyUI bound to `127.0.0.1` only
- Consider an external GPU machine or cloud GPU for batch work
- Ensure **16 GB+ RAM**; swap will slow generation further

### API returns 403

- Dev routes require `NODE_ENV=development` or `AI_DEV_ENABLED=true`
- Never enable `AI_DEV_ENABLED` in production deployments

## Performance tips

1. **Keep ComfyUI running** — first load caches models in memory
2. **Use 4 steps** — FLUX Schnell is tuned for fast inference
3. **Batch prompts** via CLI scripts for asset pipelines
4. **Apple Silicon:** PyTorch MPS is used automatically when available
5. **Reuse seeds** for consistent variations

## Security

- ComfyUI listens on **127.0.0.1** only — not exposed to the network
- `/api/dev/*` and `/dev/ai` are **development-only**
- No customer-facing pages use AI generation
- Do not commit model weights or `.env.local`

## Extending later

- Add img2img or inpainting workflows in `tools/comfyui/workflows/`
- Swap `FLUX_MODEL` for other checkpoints
- Wire admin media picker to `generateImage()` in a future phase
- Optional Docker wrapper can mount `tools/comfyui/models` as a volume

## Docker (optional)

No Docker image is bundled. To containerize ComfyUI:

1. Use the official ComfyUI Docker patterns or a community image
2. Mount `tools/comfyui/models` → `/models`
3. Set `COMFYUI_URL=http://host.docker.internal:8188` in `.env.local`

For most local development, native install via `npm run ai:install` is simpler on macOS.
