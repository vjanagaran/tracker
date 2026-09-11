import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name."),
  phone: z.string().trim().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
