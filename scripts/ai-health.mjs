#!/usr/bin/env node
/**
 * CLI health check for local ComfyUI.
 * Usage: npm run ai:health
 */

const url = process.env.COMFYUI_URL ?? "http://127.0.0.1:8188";

async function main() {
  const started = Date.now();
  try {
    const res = await fetch(`${url}/system_stats`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.error(`✗ ComfyUI unreachable (${res.status}) at ${url}`);
      process.exit(1);
    }
    console.log(`✓ ComfyUI online at ${url} (${Date.now() - started}ms)`);
  } catch (error) {
    console.error(`✗ ComfyUI unreachable at ${url}`);
    console.error(`  ${error instanceof Error ? error.message : error}`);
    console.error("  Run: npm run ai:start");
    process.exit(1);
  }
}

main();
