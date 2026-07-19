import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OpsQueueSnapshot = {
  email: {
    queued: number;
    failed: number;
    sentToday: number;
  };
  paymentWebhooks: {
    unprocessed: number;
    failed: number;
    recent: number;
  };
  shipping: {
    pendingShipments: number;
    missingAwb: number;
    failedShipments: number;
    delivered: number;
  };
  crons: {
    id: string;
    label: string;
    path: string;
    cadence: string;
    purpose: string;
  }[];
};

const CRON_CATALOG: OpsQueueSnapshot["crons"] = [
  {
    id: "sync-shipments",
    label: "Sync shipments",
    path: "/api/cron/sync-shipments",
    cadence: "Daily (+ GH Actions if configured)",
    purpose: "Pull Delhivery tracking updates for open AWBs",
  },
  {
    id: "retry-emails",
    label: "Retry emails",
    path: "/api/cron/retry-emails",
    cadence: "Daily (+ GH Actions if configured)",
    purpose: "Re-queue failed transactional emails",
  },
  {
    id: "replay-webhooks",
    label: "Replay webhooks",
    path: "/api/cron/replay-webhooks",
    cadence: "Daily (+ GH Actions if configured)",
    purpose: "Process stuck Razorpay payment webhooks",
  },
  {
    id: "expire-reservations",
    label: "Expire reservations",
    path: "/api/cron/expire-reservations",
    cadence: "Daily (+ GH Actions if configured)",
    purpose: "Release expired inventory holds",
  },
];

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getOpsQueueSnapshot(): Promise<OpsQueueSnapshot> {
  const supabase = await createSupabaseServerClient();
  const today = startOfTodayIso();

  const [
    queuedEmail,
    failedEmail,
    sentToday,
    unprocessedWh,
    failedWh,
    recentWh,
    pendingShip,
    missingAwb,
    failedShip,
    deliveredShip,
  ] = await Promise.all([
    supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("email_queue").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase
      .from("email_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("sent_at", today),
    supabase
      .from("payment_webhooks")
      .select("id", { count: "exact", head: true })
      .eq("processed", false),
    supabase
      .from("payment_webhooks")
      .select("id", { count: "exact", head: true })
      .eq("processed", false)
      .not("error", "is", null),
    supabase
      .from("payment_webhooks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", today),
    supabase.from("shipments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "label_created", "in_transit", "out_for_delivery"])
      .or("tracking_number.is.null,tracking_number.eq."),
    supabase.from("shipments").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("shipments").select("id", { count: "exact", head: true }).eq("status", "delivered"),
  ]);

  return {
    email: {
      queued: queuedEmail.count ?? 0,
      failed: failedEmail.count ?? 0,
      sentToday: sentToday.count ?? 0,
    },
    paymentWebhooks: {
      unprocessed: unprocessedWh.count ?? 0,
      failed: failedWh.count ?? 0,
      recent: recentWh.count ?? 0,
    },
    shipping: {
      pendingShipments: pendingShip.count ?? 0,
      missingAwb: missingAwb.count ?? 0,
      failedShipments: failedShip.count ?? 0,
      delivered: deliveredShip.count ?? 0,
    },
    crons: CRON_CATALOG,
  };
}
