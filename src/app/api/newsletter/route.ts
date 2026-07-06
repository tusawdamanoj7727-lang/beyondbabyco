import { NextResponse } from "next/server";
import { z } from "zod";

import { subscribeToNewsletter } from "@/lib/newsletter/subscribe";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string(),
  source: z.string().optional(),
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
      { success: false, code: "invalid", message: "Please enter a valid email address" },
      { status: 422 },
    );
  }

  const result = await subscribeToNewsletter(
    parsed.data.email,
    parsed.data.source ?? "website_newsletter",
  );

  if (result.code === "invalid") {
    return NextResponse.json(result, { status: 422 });
  }

  if (result.code === "duplicate") {
    return NextResponse.json(result, { status: 409 });
  }

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result, { status: 200 });
}
