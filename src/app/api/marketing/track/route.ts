import { NextResponse } from "next/server";

import { trackMarketingEvent } from "@/lib/marketing/analytics";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      subjectType?: "campaign" | "banner" | "announcement";
      subjectId?: string;
      eventType?: "view" | "unique_view" | "click" | "coupon_use" | "order" | "revenue";
      value?: number;
      sessionId?: string;
    };

    if (!body.subjectType || !body.subjectId || !body.eventType) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await trackMarketingEvent({
      subjectType: body.subjectType,
      subjectId: body.subjectId,
      eventType: body.eventType,
      sessionId: body.sessionId ?? null,
      value: body.value ?? 0,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
