import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

export const paths = {
  projectRoot,
  comfyRoot: __dirname,
  comfyUiDir: path.join(__dirname, "ComfyUI"),
  comfyUiVenv: path.join(__dirname, "venv"),
  modelsDir: path.join(__dirname, "models"),
  checkpointsDir: path.join(__dirname, "models/checkpoints"),
  clipDir: path.join(__dirname, "models/clip"),
  vaeDir: path.join(__dirname, "models/vae"),
  diffusionDir: path.join(__dirname, "models/diffusion_models"),
  workflowFile: path.join(__dirname, "workflows/flux-schnell.json"),
  extraModelPaths: path.join(__dirname, "extra_model_paths.yaml"),
  publicImages: path.join(projectRoot, "public/images"),
  generatedImages: path.join(projectRoot, "public/images/generated"),
  pidsDir: path.join(projectRoot, ".pids"),
  comfyUiPid: path.join(projectRoot, ".pids/comfyui.pid"),
  comfyUiLog: path.join(projectRoot, ".pids/comfyui.log"),
};

export const defaults = {
  comfyUiHost: process.env.COMFYUI_HOST ?? "127.0.0.1",
  comfyUiPort: Number(process.env.COMFYUI_PORT ?? 8188),
  comfyUiUrl: process.env.COMFYUI_URL ?? "http://127.0.0.1:8188",
  fluxModel: process.env.FLUX_MODEL ?? "flux1-schnell",
};

export function comfyUiPython() {
  return process.platform === "win32"
    ? path.join(paths.comfyUiVenv, "Scripts/python.exe")
    : path.join(paths.comfyUiVenv, "bin/python");
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
