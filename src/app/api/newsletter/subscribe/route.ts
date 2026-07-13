import { parseJsonBody } from "@/lib/api/request";
import { newsletterSubscribeBodySchema } from "@/lib/api/schemas";
import { jsonError, jsonOk } from "@/lib/api/route-helpers";
import { NEWSLETTER_MESSAGES } from "@/lib/newsletter/messages";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody(req, { schema: newsletterSubscribeBodySchema });
    if (!parsed.ok) {
      const error =
        parsed.status === 413 ? parsed.error : NEWSLETTER_MESSAGES.invalid;
      return jsonError(error, parsed.status);
    }

    const { email, name, source } = parsed.data;
    const resolvedSource = source ?? "website";

    const supabase = await createClient();

    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      name: name ?? null,
      source: resolvedSource,
      is_active: true,
      subscribed_at: new Date().toISOString(),
    });

    if (error?.code === "23505") {
      return jsonOk({ message: NEWSLETTER_MESSAGES.duplicate });
    }

    if (error) {
      return jsonError(NEWSLETTER_MESSAGES.error, 500);
    }

    return jsonOk({ message: NEWSLETTER_MESSAGES.success });
  } catch {
    return jsonError(NEWSLETTER_MESSAGES.error, 500);
  }
}
