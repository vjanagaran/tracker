"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PHOTO_MAX_BYTES, PHOTO_MIME_TYPES, profileSchema } from "./schema";

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
      phone: parsed.data.phone ? parsed.data.phone : null,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/wheel/life");
  return { saved: true };
}

function avatarPath(userId: string) {
  return `${userId}/avatar`;
}

export async function uploadProfilePhoto(
  formData: FormData,
): Promise<ProfilePhotoActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose a photo to upload." };
  }
  if (!PHOTO_MIME_TYPES.includes(file.type as (typeof PHOTO_MIME_TYPES)[number])) {
    return { error: "Use a PNG, JPEG or WebP image." };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { error: "Keep the photo under 5 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session ended. Sign in again." };
  }

  const path = avatarPath(user.id);
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: publicUrl } = supabase.storage.from("avatars").getPublicUrl(path);
  // A cache-busting query param: the object path never changes between
  // uploads, so this keeps the browser from showing the old photo.
  const photoUrl = `${publicUrl.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ photo_url: photoUrl })
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath("/profile");
  revalidatePath("/wheel/life");
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
    .from("avatars")
    .remove([avatarPath(user.id)]);

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
  revalidatePath("/wheel/life");
  return { removed: true };
}
