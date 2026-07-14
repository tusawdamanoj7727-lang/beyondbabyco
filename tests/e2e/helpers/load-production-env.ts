import fs from "fs";
import path from "path";

/** Load tests/e2e/production.env into process.env (customer creds only). */
export function loadProductionEnv(): void {
  const envPath = path.resolve(__dirname, "../production.env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (process.env[key]) continue;
    process.env[key] = value;
  }

  delete process.env.E2E_ADMIN_EMAIL;
  delete process.env.E2E_ADMIN_PASSWORD;
}
