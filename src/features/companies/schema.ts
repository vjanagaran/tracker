import { z } from "zod";
import { SOCIAL_KEYS, type SocialKey } from "./socials.ts";

export function blank(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeHttpUrl(value: string | null | undefined): string | null {
  const trimmed = blank(value);
  if (!trimmed) {
    return null;
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

/** 15 characters: state code, PAN, entity number, Z, check character. */
const GST_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export function normalizeGst(value: string | null | undefined): string | null {
  const trimmed = blank(value);
  return trimmed ? trimmed.replace(/\s+/g, "").toUpperCase() : null;
}

export function isGst(value: string) {
  return GST_PATTERN.test(value);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseYear(value: string | null | undefined): number | null {
  const trimmed = blank(value);
  if (!trimmed) {
    return null;
  }
  const year = Number(trimmed);
  return Number.isInteger(year) && year >= 1800 && year <= 2100 ? year : null;
}

const socialShape = Object.fromEntries(
  SOCIAL_KEYS.map((key) => [key, z.string().max(300)]),
) as Record<SocialKey, z.ZodString>;

export const MAX_CORE_VALUES = 12;
export const CORE_VALUE_MAX_LENGTH = 60;

export const companySchema = z
  .object({
    name: z.string().trim().min(1, "Enter the company name.").max(160),
    tagline: z.string().max(200),
    industry: z.string().max(120),
    foundedYear: z.string().max(4),
    about: z.string().max(4000),
    website: z.string().max(300),
    gstNumber: z.string().max(20),
    address: z.string().max(500),
    city: z.string().max(80),
    state: z.string().max(80),
    pincode: z.string().max(12),
    contactName: z.string().max(120),
    contactEmail: z.string().max(200),
    contactPhone: z.string().max(40),
    purpose: z.string().max(2000),
    vision: z.string().max(2000),
    mission: z.string().max(2000),
    coreValues: z
      .array(z.string().trim().min(1).max(CORE_VALUE_MAX_LENGTH))
      .max(MAX_CORE_VALUES, `Keep to ${MAX_CORE_VALUES} core values.`),
    socials: z.object(socialShape),
    isShared: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (blank(value.foundedYear) && parseYear(value.foundedYear) === null) {
      ctx.addIssue({ code: "custom", path: ["foundedYear"], message: "Enter a year." });
    }

    const gst = normalizeGst(value.gstNumber);
    if (gst && !isGst(gst)) {
      ctx.addIssue({
        code: "custom",
        path: ["gstNumber"],
        message: "A GST number has 15 characters, like 33ABCDE1234F1Z5.",
      });
    }

    const email = blank(value.contactEmail);
    if (email && !EMAIL_PATTERN.test(email)) {
      ctx.addIssue({ code: "custom", path: ["contactEmail"], message: "Enter an email address." });
    }

    const website = normalizeHttpUrl(value.website);
    if (website && !isHttpUrl(website)) {
      ctx.addIssue({ code: "custom", path: ["website"], message: "Enter a web address." });
    }

    for (const key of SOCIAL_KEYS) {
      const url = normalizeHttpUrl(value.socials[key]);
      if (url && !isHttpUrl(url)) {
        ctx.addIssue({ code: "custom", path: ["socials", key], message: "Enter a web address." });
      }
    }
  });

export type CompanyInput = z.infer<typeof companySchema>;

export function emptyCompanyInput(): CompanyInput {
  return {
    name: "",
    tagline: "",
    industry: "",
    foundedYear: "",
    about: "",
    website: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    purpose: "",
    vision: "",
    mission: "",
    coreValues: [],
    socials: Object.fromEntries(SOCIAL_KEYS.map((key) => [key, ""])) as Record<SocialKey, string>,
    isShared: true,
  };
}

/** Only keys the app knows, only addresses that parse, always with a scheme. */
export function cleanSocials(socials: Partial<Record<SocialKey, string>>) {
  const out: Partial<Record<SocialKey, string>> = {};
  for (const key of SOCIAL_KEYS) {
    const url = normalizeHttpUrl(socials[key]);
    if (url && isHttpUrl(url)) {
      out[key] = url;
    }
  }
  return out;
}

export function cleanCoreValues(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = raw.trim();
    const key = value.toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

export const LOGO_BUCKET = "company-logos";
export const BROCHURE_BUCKET = "company-brochures";
export const LOGO_MAX_BYTES = 5 * 1024 * 1024;
export const LOGO_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const BROCHURE_MAX_BYTES = 10 * 1024 * 1024;
export const BROCHURE_MIME_TYPE = "application/pdf";

export function logoObjectPath(userId: string, companyId: string) {
  return `${userId}/${companyId}/logo`;
}

export function brochureObjectPath(userId: string, companyId: string) {
  return `${userId}/${companyId}/brochure`;
}
