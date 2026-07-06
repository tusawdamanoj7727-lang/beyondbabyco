#!/usr/bin/env node
/**
 * CLI image generation via local ComfyUI.
 * Usage:
 *   npm run ai:generate -- --prompt "soft baby product photo" --category products
 *   npm run ai:generate -- --prompt "hero banner" --output hero/banner.png
 */

import { parseArgs } from "node:util";

const args = parseArgs({
  options: {
    prompt: { type: "string", short: "p" },
    "negative-prompt": { type: "string" },
    width: { type: "string" },
    height: { type: "string" },
    seed: { type: "string" },
    steps: { type: "string" },
    category: { type: "string" },
    filename: { type: "string" },
    output: { type: "string", short: "o" },
    url: { type: "string" },
  },
});

const appUrl =
  args.values.url ??
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://beyondbabyco.in";
const prompt = args.values.prompt;

if (!prompt?.trim()) {
  console.error("Usage: npm run ai:generate -- --prompt \"your prompt\" [--category temporary] [--output path.png]");
  process.exit(1);
}

const body = {
  prompt: prompt.trim(),
  negativePrompt: args.values["negative-prompt"],
  width: args.values.width ? Number(args.values.width) : undefined,
  height: args.values.height ? Number(args.values.height) : undefined,
  seed: args.values.seed ? Number(args.values.seed) : undefined,
  steps: args.values.steps ? Number(args.values.steps) : undefined,
  category: args.values.category,
  filename: args.values.filename,
  outputPath: args.values.output,
};

async function main() {
  console.log(`→ POST ${appUrl}/api/dev/generate-image`);
  const res = await fetch(`${appUrl}/api/dev/generate-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    console.error("✗ Generation failed:", data.error ?? res.statusText);
    process.exit(1);
  }

  console.log("✓ Image saved:");
  console.log(`  ${data.result.localPath}`);
  console.log(`  ${data.result.publicPath}`);
  console.log(`  seed=${data.result.seed} duration=${data.result.durationMs}ms`);
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  console.error("  Ensure: npm run dev (Next.js) and npm run ai:start (ComfyUI)");
  process.exit(1);
});
