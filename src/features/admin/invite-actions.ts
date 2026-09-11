"use server";

import "server-only";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";
import type { Database } from "@/lib/database.types";
import {
  inviteRateLimitKey,
  inviteRateLimitedMessage,
  takeRateLimit,
} from "@/lib/rate-limit";
import { inviteMemberSchema, resendInviteSchema } from "./schema";
import type { InviteActionResult } from "./types";

function appOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    return null;
  }
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

function chairmanTakenMessage(error: { message: string; code?: string }) {
  if (error.code === "23505") {
    return "This board already has a chairman. Change the current one first.";
  }
  return error.message;
}

export async function inviteMember(input: unknown): Promise<InviteActionResult> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the invite and try again.",
    };
  }

  const { supabase, user } = await requireSuperadmin();
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, name")
    .eq("id", parsed.data.boardId)
    .maybeSingle();

  if (boardError) {
    return { error: boardError.message };
  }
  if (!board) {
    return { error: "That board could not be found." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    return { error: "Invite is not configured. Set the server secret key." };
  }

  const limited = takeRateLimit(inviteRateLimitKey(user.id));
  if (!limited.ok) {
    return { error: inviteRateLimitedMessage() };
  }

  const headerStore = await headers();
  const origin = appOrigin(headerStore);
  const admin = createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { board_name: board.name },
      redirectTo: origin ? `${origin}/invite/accept` : undefined,
    },
  );

  const userId = invited?.user?.id;
  if (inviteError || !userId) {
    const message = inviteError?.message ?? "The invite could not be sent.";
    if (/already|registered|exists/i.test(message)) {
      return {
        error:
          "That email already has an account. Add them from the people already in the app.",
      };
    }
    return { error: message };
  }

  const { data: existing, error: existingError } = await supabase
    .from("board_members")
    .select("id, status")
    .eq("board_id", parsed.data.boardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }
  if (existing?.status === "active") {
    return { error: "That person is already on this board." };
  }

  if (existing) {
    const { error } = await supabase
      .from("board_members")
      .update({
        role: parsed.data.role,
        status: "active",
        left_on: null,
        joined_on: new Date().toISOString().slice(0, 10),
      })
      .eq("id", existing.id);

    if (error) {
      return { error: chairmanTakenMessage(error) };
    }
  } else {
    const { error } = await supabase.from("board_members").insert({
      board_id: parsed.data.boardId,
      user_id: userId,
      role: parsed.data.role,
      status: "active",
    });

    if (error) {
      return { error: chairmanTakenMessage(error) };
    }
  }

  revalidatePath("/admin/boards");
  revalidatePath(`/admin/boards/${parsed.data.boardId}`);
  revalidatePath("/boards");
  return { ok: true, message: "Invite sent." };
}

export async function resendInvite(input: unknown): Promise<InviteActionResult> {
  const parsed = resendInviteSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the invite and try again.",
    };
  }

  const { supabase, user } = await requireSuperadmin();
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id, name")
    .eq("id", parsed.data.boardId)
    .maybeSingle();

  if (boardError) {
    return { error: boardError.message };
  }
  if (!board) {
    return { error: "That board could not be found." };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("board_members")
    .select("id, user_id")
    .eq("id", parsed.data.membershipId)
    .eq("board_id", parsed.data.boardId)
    .maybeSingle();

  if (membershipError) {
    return { error: membershipError.message };
  }
  if (!membership) {
    return { error: "That member could not be found." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    return { error: "Invite is not configured. Set the server secret key." };
  }

  const limited = takeRateLimit(inviteRateLimitKey(user.id));
  if (!limited.ok) {
    return { error: inviteRateLimitedMessage() };
  }

  const admin = createClient<Database>(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingUser, error: getUserError } = await admin.auth.admin.getUserById(
    membership.user_id,
  );
  if (getUserError || !existingUser?.user?.email) {
    return { error: getUserError?.message ?? "That member has no email on file." };
  }
  if (existingUser.user.confirmed_at ?? existingUser.user.email_confirmed_at) {
    return { error: "That person has already accepted their invite." };
  }

  const headerStore = await headers();
  const origin = appOrigin(headerStore);

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    existingUser.user.email,
    {
      data: { board_name: board.name },
      redirectTo: origin ? `${origin}/invite/accept` : undefined,
    },
  );

  if (inviteError) {
    return { error: inviteError.message };
  }

  revalidatePath(`/admin/boards/${parsed.data.boardId}`);
  return { ok: true, message: "Invite resent." };
}
