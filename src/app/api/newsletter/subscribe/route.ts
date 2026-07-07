import { NextResponse } from "next/server";

import { NEWSLETTER_MESSAGES } from "@/lib/newsletter/messages";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; name?: string; source?: string };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    const source = String(body.source ?? "website").trim() || "website";
    const name = body.name?.trim() || null;

    if (!email.includes("@")) {
      return NextResponse.json({ error: NEWSLETTER_MESSAGES.invalid }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      name,
      source,
      is_active: true,
      subscribed_at: new Date().toISOString(),
    });

    if (error?.code === "23505") {
      return NextResponse.json({
        success: true,
        message: NEWSLETTER_MESSAGES.duplicate,
      });
    }

    if (error) {
      return NextResponse.json({ error: NEWSLETTER_MESSAGES.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: NEWSLETTER_MESSAGES.success,
    });
  } catch {
    return NextResponse.json({ error: NEWSLETTER_MESSAGES.error }, { status: 500 });
  }
}
