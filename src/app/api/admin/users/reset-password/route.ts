import { z } from "zod";

import { logApiAction } from "@/lib/api/audit";
import { parseJsonBody } from "@/lib/api/request";
import { uuidSchema } from "@/lib/api/schemas";
import { jsonOk, jsonError } from "@/lib/api/route-helpers";
import { passwordResetRedirectUrl } from "@/lib/auth/auth-urls";
import { handleAdminApiError, requireAdminUserApi } from "@/lib/api/admin-user-api";
import { getSmtpConfig } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/sendEmail";

export const dynamic = "force-dynamic";

const resetSchema = z.object({
  userId: uuidSchema,
});

/** Send a one-time password reset link to the user's email (admin only). */
export async function POST(request: Request) {
  const gate = await requireAdminUserApi();
  if (!gate.ok) return gate.response;

  if (!getSmtpConfig()) {
    return jsonError("Email is not configured. Cannot send a password reset link.", 503);
  }

  try {
    const parsed = await parseJsonBody(request, { schema: resetSchema });
    if (!parsed.ok) {
      return jsonError(parsed.error, parsed.status);
    }

    const { userId } = parsed.data;

    const { data: userData, error: userError } = await gate.admin.auth.admin.getUserById(userId);
    if (userError || !userData.user.email) {
      return jsonError("User not found.", 404);
    }

    const email = userData.user.email;
    const redirectTo = passwordResetRedirectUrl();

    const { data: linkData, error: linkError } = await gate.admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkError || !linkData.properties?.action_link) {
      return jsonError("Could not create password reset link.", 400);
    }

    const actionLink = linkData.properties.action_link;

    const sendResult = await sendEmail({
      to: email,
      subject: "Reset your BeyondBabyCo password",
      html: `<p>An administrator requested a password reset for your account.</p><p><a href="${actionLink}">Set a new password</a></p><p>This link expires soon. If you did not expect this email, contact support.</p>`,
      text: `An administrator requested a password reset. Open this link to set a new password: ${actionLink}`,
      tags: ["admin-password-reset"],
    });

    if (!sendResult.ok) {
      return jsonError("Could not send password reset email.", 502);
    }

    logApiAction({
      action: "api.admin.users.reset_password",
      entity: "profiles",
      entityId: userId,
    });

    return jsonOk({ userId, emailSent: true });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
