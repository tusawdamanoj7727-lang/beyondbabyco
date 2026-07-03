import { describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/observability/logger";

describe("structured logger", () => {
  it("formats JSON logs", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    logger.info("test message", { requestId: "abc" });
    expect(spy).toHaveBeenCalled();
    const payload = JSON.parse(String(spy.mock.calls[0][0]));
    expect(payload.level).toBe("info");
    expect(payload.message).toBe("test message");
    expect(payload.requestId).toBe("abc");
    spy.mockRestore();
  });
});
