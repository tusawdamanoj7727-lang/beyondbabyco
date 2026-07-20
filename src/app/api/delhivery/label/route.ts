import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { userOwnsOrder } from "@/lib/orders/customer-auth";
import { jsonError, requireAuthenticatedApi, requireStaffApi } from "@/lib/api/route-helpers";
import { labelQuerySchema } from "@/lib/delhivery/schemas";
import { delhiveryFetchLabel } from "@/lib/delhivery/service";
import { generateLabel } from "@/lib/delhivery/client";

export const dynamic = "force-dynamic";

const ALLOWED_LABEL_HOST_SUFFIXES = [
  "delhivery.com",
  "delhivery.co",
  "dlvcdn.com",
  "amazonaws.com",
  "cloudfront.net",
] as const;

function isAllowedLabelUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_LABEL_HOST_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

function redirectLabel(url: string) {
  if (!isAllowedLabelUrl(url)) {
    return jsonError("Label URL is not from a trusted host", 502);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = labelQuerySchema.safeParse({
    waybill: searchParams.get("waybill"),
    shipmentId: searchParams.get("shipmentId") ?? undefined,
  });
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid query", 422);
  }

  const supabase = await createSupabaseServerClient();
  if (parsed.data.shipmentId) {
    const { data: shipment } = await supabase
      .from("shipments")
      .select("order_id, label_url")
      .eq("id", parsed.data.shipmentId)
      .maybeSingle();

    const staff = await requireStaffApi();
    if (!staff.ok && shipment) {
      const customer = await requireAuthenticatedApi();
      if (!customer.ok) return customer.response;
      const owns = await userOwnsOrder(shipment.order_id, customer.userId);
      if (!owns) return jsonError("Forbidden", 403);
    } else if (!staff.ok) {
      return staff.response;
    }

    if (shipment?.label_url && !searchParams.get("format")) {
      return redirectLabel(shipment.label_url);
    }
  } else {
    const staff = await requireStaffApi();
    if (!staff.ok) return staff.response;
  }

  if (searchParams.get("format") === "pdf") {
    try {
      const label = await generateLabel(parsed.data.waybill);
      if (label.pdfBase64) {
        const buffer = Buffer.from(label.pdfBase64, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="label-${parsed.data.waybill}.pdf"`,
          },
        });
      }
      if (label.labelUrl) return redirectLabel(label.labelUrl);
    } catch {
      return jsonError("Label download failed", 502);
    }
  }

  const result = await delhiveryFetchLabel(parsed.data.waybill);
  if (!result.ok) return jsonError(result.error ?? "Label fetch failed", 502);

  const labelUrl = result.data?.labelUrl as string | undefined;
  if (labelUrl) return redirectLabel(labelUrl);

  return jsonError("Label not available", 404);
}
