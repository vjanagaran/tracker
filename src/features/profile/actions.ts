"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  AVATAR_BUCKET,
  avatarObjectPath,
  emptyToNull,
  normalizeHttpUrl,
  parseFoundedYear,
  profileSchema,
} from "./schema";

export type ProfileActionResult = { error: string } | { saved: true };
export type ProfilePhotoActionResult = { error: string } | { photoUrl: string };
export type RemoveProfilePhotoResult = { error: string } | { removed: true };

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
      phone: emptyToNull(parsed.data.phone),
      designation: emptyToNull(parsed.data.designation),
      company: emptyToNull(parsed.data.company),
      company_founded_year: parseFoundedYear(parsed.data.companyFoundedYear),
      industry: emptyToNull(parsed.data.industry),
      city: emptyToNull(parsed.data.city),
      about: emptyToNull(parsed.data.about),
      about_company: emptyToNull(parsed.data.aboutCompany),
      website: normalizeHttpUrl(parsed.data.website),
      linkedin: normalizeHttpUrl(parsed.data.linkedin),
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath(`/people/${user.id}`);
  revalidatePath("/boards");
  return { saved: true };
}

export async function saveProfilePhotoUrl(
  photoUrl: string,
): Promise<ProfilePhotoActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session ended. Sign in again." };
  }

  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const expected = origin
    ? `${origin}/storage/v1/object/public/${AVATAR_BUCKET}/${avatarObjectPath(user.id)}`
    : null;
  const [withoutQuery] = photoUrl.split("?");
  if (!expected || withoutQuery !== expected) {
    return { error: "That photo could not be saved." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ photo_url: photoUrl })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/profile");
  revalidatePath(`/people/${user.id}`);
  revalidatePath("/boards");
  return { photoUrl };
}

export async function removeProfilePhoto(): Promise<RemoveProfilePhotoResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session ended. Sign in again." };
  }

  const { error: removeError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([avatarObjectPath(user.id)]);

  if (removeError) {
    return { error: removeError.message };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ photo_url: null })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/profile");
  revalidatePath(`/people/${user.id}`);
  revalidatePath("/boards");
  return { removed: true };
}
