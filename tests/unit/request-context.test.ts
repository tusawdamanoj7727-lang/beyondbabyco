import { describe, expect, it } from "vitest";

import { generateRequestId } from "@/lib/observability/request-id";

describe("request context", () => {
  it("generates UUID request IDs", () => {
    const id = generateRequestId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
