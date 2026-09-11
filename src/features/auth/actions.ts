"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInviteSchema, signInSchema } from "./schema";

export type AuthActionResult = { error: string };

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

  redirect("/wheel/life");
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

  redirect("/wheel/life");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
