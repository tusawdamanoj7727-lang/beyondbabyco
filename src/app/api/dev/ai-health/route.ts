import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { checkComfyUiHealth, isAiDevEnabled } from "@/lib/ai/generateImage";
import { logAiHealth } from "@/lib/ai/logger";
import { isDevApiBlocked } from "@/lib/security/dev-api";

/** GET /api/dev/ai-health — local ComfyUI health (dev only) */
export async function GET() {
  if (isDevApiBlocked()) {
    return jsonError("Not found", 404);
  }
  if (!isAiDevEnabled()) {
    return jsonError("AI dev tools are disabled in this environment", 403);
  }

  const health = await checkComfyUiHealth();
  logAiHealth(health);

  return jsonOk({ health });
}
