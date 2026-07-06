import { NextResponse } from "next/server";
import { z } from "zod";

import { subscribeToNotifyMe } from "@/lib/notify-me/subscribe";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string(),
  productCategory: z.string().trim().min(1),
  productId: z.string().uuid().optional(),
  productName: z.string().trim().optional(),
  mode: z.enum(["launch", "restock"]).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, code: "invalid", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, code: "invalid", message: "Please enter a valid email address." },
      { status: 422 },
    );
  }

  const result = await subscribeToNotifyMe(parsed.data);

  if (result.code === "invalid") {
    return NextResponse.json(result, { status: 422 });
  }

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  const status = result.code === "duplicate" ? 409 : 200;
  return NextResponse.json(result, { status });
}
