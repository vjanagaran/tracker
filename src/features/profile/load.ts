import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { PublicProfile } from "./types";

type Client = SupabaseClient<Database>;

const PROFILE_COLUMNS =
  "id, full_name, email, phone, photo_url, designation, company, company_founded_year, industry, city, about, about_company, website, linkedin";

function toPublicProfile(
  row: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    photo_url: string | null;
    designation: string | null;
    company: string | null;
    company_founded_year: number | null;
    industry: string | null;
    city: string | null;
    about: string | null;
    about_company: string | null;
    website: string | null;
    linkedin: string | null;
  },
): PublicProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    photoUrl: row.photo_url,
    designation: row.designation,
    company: row.company,
    companyFoundedYear: row.company_founded_year,
    industry: row.industry,
    city: row.city,
    about: row.about,
    aboutCompany: row.about_company,
    website: row.website,
    linkedin: row.linkedin,
  };
}

export async function canViewProfile(
  supabase: Client,
  viewerId: string,
  targetId: string,
): Promise<boolean> {
  if (viewerId === targetId) {
    return true;
  }

  const { data: mine, error: mineError } = await supabase
    .from("board_members")
    .select("board_id")
    .eq("user_id", viewerId)
    .eq("status", "active");

  if (mineError) {
    throw new Error(mineError.message);
  }

  const boardIds = (mine ?? []).map((row) => row.board_id);
  if (boardIds.length === 0) {
    return false;
  }

  const { data: shared, error: sharedError } = await supabase
    .from("board_members")
    .select("id")
    .eq("user_id", targetId)
    .eq("status", "active")
    .in("board_id", boardIds)
    .limit(1);

  if (sharedError) {
    throw new Error(sharedError.message);
  }

  return (shared ?? []).length > 0;
}

export async function loadPublicProfile(
  supabase: Client,
  userId: string,
): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  return toPublicProfile(data);
}
