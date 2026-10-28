import type { SocialKey } from "./socials.ts";

export type Company = {
  id: string;
  userId: string;
  name: string;
  logoUrl: string | null;
  tagline: string | null;
  industry: string | null;
  foundedYear: number | null;
  about: string | null;
  website: string | null;
  gstNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  purpose: string | null;
  vision: string | null;
  mission: string | null;
  coreValues: string[];
  socials: Partial<Record<SocialKey, string>>;
  brochure: { name: string; size: number } | null;
  /** On means members of the owner's boards can see it. */
  isShared: boolean;
};
