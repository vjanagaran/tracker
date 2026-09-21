import { z } from "zod";

function blankToUndefined(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function emptyToNull(value: string | undefined) {
  return blankToUndefined(value) ?? null;
}

export function parseFoundedYear(value: string | undefined): number | null {
  const trimmed = blankToUndefined(value);
  if (!trimmed) {
    return null;
  }
  const year = Number(trimmed);
  if (!Number.isInteger(year) || year < 1800 || year > 2100) {
    return null;
  }
  return year;
}

export function normalizeHttpUrl(value: string | undefined): string | null {
  const trimmed = blankToUndefined(value);
  if (!trimmed) {
    return null;
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isTimeZone(value: string) {
  if (!value) {
    return false;
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export const profileSchema = z
  .object({
    fullName: z.string().trim().min(1, "Enter your name."),
    phone: z.string().max(40).optional(),
    morningNoteOn: z.boolean(),
    timezone: z.string(),
    designation: z.string().max(120).optional(),
    company: z.string().max(160).optional(),
    companyFoundedYear: z.string().max(4).optional(),
    industry: z.string().max(120).optional(),
    city: z.string().max(80).optional(),
    about: z.string().max(2000).optional(),
    aboutCompany: z.string().max(2000).optional(),
    website: z.string().max(300).optional(),
    linkedin: z.string().max(300).optional(),
  })
  .superRefine((value, ctx) => {
    const year = blankToUndefined(value.companyFoundedYear);
    if (year) {
      const parsed = Number(year);
      if (!Number.isInteger(parsed) || parsed < 1800 || parsed > 2100) {
        ctx.addIssue({
          code: "custom",
          path: ["companyFoundedYear"],
          message: "Enter a year.",
        });
      }
    }

    const website = normalizeHttpUrl(value.website);
    if (blankToUndefined(value.website) && (!website || !isHttpUrl(website))) {
      ctx.addIssue({
        code: "custom",
        path: ["website"],
        message: "Enter a web address.",
      });
    }

    const linkedin = normalizeHttpUrl(value.linkedin);
    if (blankToUndefined(value.linkedin) && (!linkedin || !isHttpUrl(linkedin))) {
      ctx.addIssue({
        code: "custom",
        path: ["linkedin"],
        message: "Enter a web address.",
      });
    }

    if (value.morningNoteOn && !isTimeZone(value.timezone)) {
      ctx.addIssue({
        code: "custom",
        path: ["timezone"],
        message: "Choose your timezone so the note arrives at 7:00.",
      });
    }
  });

export type ProfileInput = z.infer<typeof profileSchema>;

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const AVATAR_BUCKET = "avatars";

export function avatarObjectPath(userId: string) {
  return `${userId}/avatar`;
}
