import { parseJsonBody } from "@/lib/api/request";
import { notifyMeBodySchema } from "@/lib/api/schemas";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request, { schema: notifyMeBodySchema });
    if (!parsed.ok) {
      return jsonError(parsed.error, parsed.status);
    }

    const { email, productCategory, productId, productName, mode, source } = parsed.data;
    const isRestock = mode === "restock";
    const resolvedSource = source ?? "website";
    const displayName = productName ?? productCategory;

    const supabase = await createClient();

    const { error } = await supabase.from("waitlist").insert({
      email,
      product_category: productCategory ?? null,
      product_id: productId ?? null,
      source: resolvedSource,
    });

    if (error?.code === "23505") {
      return jsonOk(
        {
          message: productCategory
            ? `You're already on the list for ${productCategory} — we'll be in touch soon.`
            : "You're already on the list — we'll be in touch soon.",
        },
        409,
      );
    }

    if (error) throw error;

    const message = isRestock
      ? `You're on the list! We'll email you when ${displayName} is back in stock.`
      : productCategory
        ? "We will notify you! 🎉"
        : "We'll notify you when it's available!";

    return jsonOk({ message });
  } catch {
    return jsonError("Something went wrong. Please try again.", 500);
  }
}
