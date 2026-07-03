import { NextResponse } from "next/server";

import { syncPendingDelhiveryShipments } from "@/lib/delhivery/service";

export const dynamic = "force-dynamic";

/** Cron endpoint — sync Delhivery tracking for pending shipments. */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!cronSecret) {
      return NextResponse.json({ ok: false, error: "Cron not configured" }, { status: 503 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  } else if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncPendingDelhiveryShipments();
  return NextResponse.json({ ok: true, ...result, timestamp: new Date().toISOString() });
}

export async function POST(request: Request) {
  return GET(request);
}
