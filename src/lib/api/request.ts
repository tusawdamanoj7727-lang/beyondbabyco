import type { ZodType } from "zod";

export const DEFAULT_JSON_BODY_LIMIT = 64 * 1024;
export const WEBHOOK_JSON_BODY_LIMIT = 256 * 1024;

type ParseJsonBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

export function rejectOversizedBody(
  request: Request,
  maxBytes: number,
): { ok: false; response: Response } | { ok: true } {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const length = Number.parseInt(contentLength, 10);
    if (!Number.isNaN(length) && length > maxBytes) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({ ok: false, error: "Request body too large" }),
          { status: 413, headers: { "Content-Type": "application/json" } },
        ),
      };
    }
  }
  return { ok: true };
}

export async function parseJsonBody<T>(
  request: Request,
  options: { maxBytes?: number; schema?: ZodType<T> } = {},
): Promise<ParseJsonBodyResult<T>> {
  const maxBytes = options.maxBytes ?? DEFAULT_JSON_BODY_LIMIT;

  const sizeCheck = rejectOversizedBody(request, maxBytes);
  if (!sizeCheck.ok) {
    return { ok: false, error: "Request body too large", status: 413 };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, error: "Invalid request body", status: 400 };
  }

  if (text.length > maxBytes) {
    return { ok: false, error: "Request body too large", status: 413 };
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid request body", status: 400 };
  }

  if (options.schema) {
    const parsed = options.schema.safeParse(body);
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid request body",
        status: 400,
      };
    }
    return { ok: true, data: parsed.data };
  }

  return { ok: true, data: body as T };
}
