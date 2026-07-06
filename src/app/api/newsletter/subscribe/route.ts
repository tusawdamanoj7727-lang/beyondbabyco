import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().trim().optional(),
  source: z.string().default("website"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Please enter a valid email";
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const { email, name, source } = parsed.data;
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("newsletter_subscribers").insert({
      email: email.toLowerCase(),
      name: name || null,
      source,
      is_active: true,
      subscribed_at: new Date().toISOString(),
    });

    if (error?.code === "23505") {
      return NextResponse.json({
        success: true,
        message: "You're already subscribed!",
      });
    }

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Welcome to the BeyondBabyCo family!",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
