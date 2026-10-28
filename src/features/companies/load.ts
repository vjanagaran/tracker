import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import { SOCIAL_KEYS, type SocialKey } from "./socials";
import type { Company } from "./types";

type Client = SupabaseClient<Database>;

export const COMPANY_COLUMNS =
  "id, user_id, name, logo_url, tagline, industry, founded_year, about, website, gst_number, address, city, state, pincode, contact_name, contact_email, contact_phone, purpose, vision, mission, core_values, socials, brochure_path, brochure_name, brochure_size, is_shared" as const;

type CompanyRow = Pick<
  Database["public"]["Tables"]["companies"]["Row"],
  | "id"
  | "user_id"
  | "name"
  | "logo_url"
  | "tagline"
  | "industry"
  | "founded_year"
  | "about"
  | "website"
  | "gst_number"
  | "address"
  | "city"
  | "state"
  | "pincode"
  | "contact_name"
  | "contact_email"
  | "contact_phone"
  | "purpose"
  | "vision"
  | "mission"
  | "core_values"
  | "socials"
  | "brochure_path"
  | "brochure_name"
  | "brochure_size"
  | "is_shared"
>;

function readSocials(value: Json): Company["socials"] {
  const out: Company["socials"] = {};
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const key of SOCIAL_KEYS) {
      const url = (value as Record<string, Json | undefined>)[key];
      if (typeof url === "string" && url) {
        out[key as SocialKey] = url;
      }
    }
  }
  return out;
}

export function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    logoUrl: row.logo_url,
    tagline: row.tagline,
    industry: row.industry,
    foundedYear: row.founded_year,
    about: row.about,
    website: row.website,
    gstNumber: row.gst_number,
    address: row.address,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    purpose: row.purpose,
    vision: row.vision,
    mission: row.mission,
    coreValues: row.core_values ?? [],
    socials: readSocials(row.socials),
    brochure: row.brochure_path
      ? { name: row.brochure_name ?? "Brochure", size: row.brochure_size ?? 0 }
      : null,
    isShared: row.is_shared,
  };
}

/** Companies one person owns, in the order they set. Row-level security decides what the caller sees. */
export async function loadCompaniesOf(supabase: Client, ownerId: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("user_id", ownerId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map(mapCompany);
}

/** Companies for several people at once, grouped by owner. */
export async function loadCompaniesByOwner(
  supabase: Client,
  ownerIds: string[],
): Promise<Map<string, Company[]>> {
  const grouped = new Map<string, Company[]>();
  if (ownerIds.length === 0) {
    return grouped;
  }

  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .in("user_id", ownerIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  for (const row of data ?? []) {
    const list = grouped.get(row.user_id) ?? [];
    list.push(mapCompany(row));
    grouped.set(row.user_id, list);
  }
  return grouped;
}

/** One company, or null when it does not exist or the caller may not see it. */
export async function loadCompany(supabase: Client, companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from("companies")
    .select(COMPANY_COLUMNS)
    .eq("id", companyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? mapCompany(data) : null;
}
