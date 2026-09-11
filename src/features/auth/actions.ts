"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  passwordResetRateLimitKey,
  passwordResetRateLimitedMessage,
  takeRateLimit,
} from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  acceptInviteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
} from "./schema";

export type AuthActionResult = { error: string };

function appOrigin(headerStore: Headers) {
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    return null;
  }
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function signIn(
  input: unknown,
): Promise<AuthActionResult | void> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      error: "That email or password was not recognised. Check both and try again.",
    };
  }

  redirect("/tasks");
}

export async function acceptInvite(
  input: unknown,
): Promise<AuthActionResult | void> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "This invite link is no longer valid. Open the link in your email again.",
    };
  }

  const { error: passwordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { full_name: parsed.data.fullName },
  });

  if (passwordError) {
    return { error: passwordError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ? parsed.data.phone : null,
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  redirect("/tasks");
}

export type ForgotPasswordResult = { error: string } | { sent: true };

export async function requestPasswordReset(
  input: unknown,
): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const limited = takeRateLimit(passwordResetRateLimitKey(parsed.data.email));
  if (!limited.ok) {
    return { error: passwordResetRateLimitedMessage() };
  }

  const headerStore = await headers();
  const origin = appOrigin(headerStore);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: origin ? `${origin}/reset-password` : undefined,
  });

  if (error && /rate limit/i.test(error.message)) {
    return { error: passwordResetRateLimitedMessage() };
  }

  // Supabase does not report whether the email has an account. Answer the
  // same way either way, so this cannot be used to find out who does.
  return { sent: true };
}

export async function resetPassword(
  input: unknown,
): Promise<AuthActionResult | void> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "This reset link is no longer valid. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }

  redirect("/tasks");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
