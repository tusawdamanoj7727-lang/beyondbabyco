/** Shared env parsing for setup scripts (no secrets, no hardcoding). */

const PLACEHOLDER_PATTERNS = {
  NEXT_PUBLIC_SUPABASE_URL: ["your-project", "your-project-ref"],
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ["your-anon-key"],
  SUPABASE_SERVICE_ROLE_KEY: ["your-service-role-key"],
};

export function loadEnvFile(path, readFileSync, existsSync) {
  if (!existsSync(path)) return null;
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

export function isEnvValueMissing(key, value) {
  if (!value || !value.trim()) return true;
  const patterns = PLACEHOLDER_PATTERNS[key];
  if (!patterns) return false;
  const lower = value.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}

export function auditSupabaseEnv(env) {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const recommended = ["SUPABASE_SERVICE_ROLE_KEY"];

  const missing = [];
  const configured = [];

  for (const key of required) {
    if (isEnvValueMissing(key, env[key])) {
      missing.push({ key, required: true });
    } else {
      configured.push(key);
    }
  }

  for (const key of recommended) {
    if (isEnvValueMissing(key, env[key])) {
      missing.push({ key, required: false });
    } else {
      configured.push(key);
    }
  }

  return { missing, configured };
}
