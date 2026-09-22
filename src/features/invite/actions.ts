"use server";

import "server-only";
import { headers } from "next/headers";
import { inviteAcceptUrl } from "@/lib/app-url";
import { requireUser } from "@/lib/auth/require-user";
import {
  inviteRateLimitKey,
  inviteRateLimitedMessage,
  takeRateLimit,
} from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteFriendSchema, type InviteFriendResult } from "./schema";

export async function inviteFriend(input: unknown): Promise<InviteFriendResult> {
  const parsed = inviteFriendSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the invite and try again.",
    };
  }

  const { user } = await requireUser();
  const email = parsed.data.email.toLowerCase();
  if (user.email && user.email.toLowerCase() === email) {
    return { error: "Use a different email." };
  }

  const limited = takeRateLimit(inviteRateLimitKey(user.id));
  if (!limited.ok) {
    return { error: inviteRateLimitedMessage() };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Invite is not configured. Set the server secret key." };
  }

  const headerStore = await headers();
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteAcceptUrl(headerStore),
  });

  if (inviteError) {
    const message = inviteError.message;
    if (/already|registered|exists/i.test(message)) {
      return { error: "That email already has an account." };
    }
    return { error: message };
  }

  return { ok: true, message: "Invite sent." };
}
