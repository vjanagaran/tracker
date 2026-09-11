import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name."),
  phone: z.string().trim().optional(),
  photoUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.string().url().safeParse(value).success,
      "Enter a full photo URL, or leave this blank.",
    ),
});

export type ProfileInput = z.infer<typeof profileSchema>;
