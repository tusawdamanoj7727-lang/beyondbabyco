import { performance } from "perf_hooks";

import { logger } from "./logger";

/** Log slow async operations without changing business logic. */
export async function withTiming<T>(
  label: string,
  fn: () => Promise<T>,
  slowThresholdMs = 500,
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const durationMs = Math.round(performance.now() - start);
    if (durationMs >= slowThresholdMs) {
      logger.warn("Slow operation", { label, durationMs });
    }
  }
}
