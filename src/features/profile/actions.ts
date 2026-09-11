"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "./schema";

export type ProfileActionResult = { error: string } | { saved: true };

export async function updateProfile(
  input: unknown,
): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the form and try again.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session ended. Sign in again." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ? parsed.data.phone : null,
      photo_url: parsed.data.photoUrl ? parsed.data.photoUrl : null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/wheel/life");
  return { saved: true };
}
