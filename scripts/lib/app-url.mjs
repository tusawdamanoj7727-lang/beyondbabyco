/** Shared app URL helpers for Node scripts (mirrors src/lib/app-url.ts). */

export function normalizeAppUrl(url) {
  return url.trim().replace(/\/+$/, "");
}

export function getAppUrlFromEnv(env) {
  const configured = env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required in .env.local — set it to the URL you open in the browser (include port).",
    );
  }
  return normalizeAppUrl(configured);
}

export function getAppUrlPort(baseUrl) {
  const url = new URL(baseUrl);
  if (url.port) return Number(url.port);
  return url.protocol === "https:" ? 443 : 80;
}

export function isLocalhostAppUrl(baseUrl) {
  try {
    const { hostname } = new URL(baseUrl);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

const DEFAULT_PROBE_PORTS = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];

/**
 * Probe local ports for a running Next.js dev server.
 * Returns the first port that responds OK on the health endpoint.
 */
export async function detectActiveDevServerPort(options = {}) {
  const ports = options.ports ?? DEFAULT_PROBE_PORTS;
  const path = options.path ?? "/api/health/memory";
  const timeoutMs = options.timeoutMs ?? 1500;

  for (const port of ports) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}${path}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok) return port;
    } catch {
      /* try next port */
    }
  }

  return null;
}

export function formatLocalAppUrl(port) {
  return `http://localhost:${port}`;
}
