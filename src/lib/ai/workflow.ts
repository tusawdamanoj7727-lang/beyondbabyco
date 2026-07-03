import fs from "node:fs";
import path from "node:path";

import type { GenerateImageOptions } from "./types";

const WORKFLOW_PATH = path.join(
  process.cwd(),
  "tools/comfyui/workflows/flux-schnell.json",
);

type WorkflowNode = {
  class_type: string;
  inputs: Record<string, unknown>;
};

export type FluxWorkflowParams = {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed: number;
  steps: number;
  fluxModel: string;
};

function loadTemplate(): Record<string, WorkflowNode> {
  const raw = fs.readFileSync(WORKFLOW_PATH, "utf8");
  const parsed = JSON.parse(raw) as Record<string, WorkflowNode>;
  delete (parsed as Record<string, unknown>)["_comment"];
  return parsed;
}

function cloneWorkflow(template: Record<string, WorkflowNode>): Record<string, WorkflowNode> {
  return structuredClone(template);
}

/** Build a ComfyUI API workflow for FLUX.1 Schnell with runtime parameters. */
export function buildFluxSchnellWorkflow(params: FluxWorkflowParams): Record<string, WorkflowNode> {
  const workflow = cloneWorkflow(loadTemplate());
  const modelFile = params.fluxModel.endsWith(".safetensors")
    ? params.fluxModel
    : `${params.fluxModel}.safetensors`;

  if (workflow["37"]) {
    workflow["37"].inputs.unet_name = modelFile;
    workflow["37"].inputs.weight_dtype =
      params.fluxModel.includes("fp8") ? "fp8_e4m3fn" : "default";
  }

  if (workflow["40"]) {
    workflow["40"].inputs.width = params.width;
    workflow["40"].inputs.height = params.height;
  }

  if (workflow["42"]) {
    workflow["42"].inputs.text = params.prompt;
  }

  if (workflow["43"]) {
    workflow["43"].inputs.text = params.negativePrompt;
  }

  if (workflow["31"]) {
    workflow["31"].inputs.seed = params.seed;
    workflow["31"].inputs.steps = params.steps;
  }

  return workflow;
}

export function resolveGenerationParams(
  prompt: string,
  options: GenerateImageOptions,
  fluxModel: string,
): FluxWorkflowParams {
  return {
    prompt,
    negativePrompt: options.negativePrompt ?? "",
    width: options.width ?? 1024,
    height: options.height ?? 1024,
    seed: options.seed ?? Math.floor(Math.random() * 2 ** 32),
    steps: options.steps ?? 4,
    fluxModel,
  };
}
