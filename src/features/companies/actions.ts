"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import type { Database } from "@/lib/database.types";
import { COMPANY_COLUMNS, mapCompany } from "./load";
import {
  BROCHURE_BUCKET,
  BROCHURE_MAX_BYTES,
  LOGO_BUCKET,
  blank,
  brochureObjectPath,
  cleanCoreValues,
  cleanSocials,
  companySchema,
  logoObjectPath,
  normalizeGst,
  normalizeHttpUrl,
  parseYear,
} from "./schema";
import type { Company } from "./types";

type CompanyWrite = Omit<
  Database["public"]["Tables"]["companies"]["Insert"],
  "id" | "user_id" | "logo_url" | "brochure_path" | "brochure_name" | "brochure_size"
>;

export type CompanyResult = { error: string } | { ok: true; company: Company };
export type CompanyRemoveResult = { error: string } | { ok: true };

const idSchema = z.string().uuid();

function row(data: z.infer<typeof companySchema>): CompanyWrite {
  return {
    name: data.name.trim(),
    tagline: blank(data.tagline),
    industry: blank(data.industry),
    founded_year: parseYear(data.foundedYear),
    about: blank(data.about),
    website: normalizeHttpUrl(data.website),
    gst_number: normalizeGst(data.gstNumber),
    address: blank(data.address),
    city: blank(data.city),
    state: blank(data.state),
    pincode: blank(data.pincode),
    contact_name: blank(data.contactName),
    contact_email: blank(data.contactEmail),
    contact_phone: blank(data.contactPhone),
    purpose: blank(data.purpose),
    vision: blank(data.vision),
    mission: blank(data.mission),
    core_values: cleanCoreValues(data.coreValues),
    socials: cleanSocials(data.socials),
    is_shared: data.isShared,
  };
}

function refresh(companyId?: string) {
  revalidatePath("/profile/companies");
  revalidatePath("/people/[userId]", "page");
  revalidatePath("/boards/[boardId]", "page");
  if (companyId) {
    revalidatePath(`/companies/${companyId}`);
    revalidatePath(`/profile/companies/${companyId}`);
  }
}

export async function createCompany(input: unknown): Promise<CompanyResult> {
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the company and try again." };
  }

  const { supabase, user } = await requireUser();

  const { data: last } = await supabase
    .from("companies")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("companies")
    .insert({ ...row(parsed.data), user_id: user.id, sort_order: (last?.sort_order ?? -1) + 1 })
    .select(COMPANY_COLUMNS)
    .single();

  if (error || !data) {
    return { error: error?.message ?? "The company could not be added." };
  }

  refresh(data.id);
  return { ok: true, company: mapCompany(data) };
}

export async function updateCompany(companyId: string, input: unknown): Promise<CompanyResult> {
  if (!idSchema.safeParse(companyId).success) {
    return { error: "That company could not be found." };
  }
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the company and try again." };
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("companies")
    .update(row(parsed.data))
    .eq("id", companyId)
    .select(COMPANY_COLUMNS)
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: "That company could not be found." };
  }

  refresh(companyId);
  return { ok: true, company: mapCompany(data) };
}

export async function deleteCompany(companyId: string): Promise<CompanyRemoveResult> {
  if (!idSchema.safeParse(companyId).success) {
    return { error: "That company could not be found." };
  }

  const { supabase, user } = await requireUser();

  // Files first, so none are left behind once the row is gone.
  await supabase.storage.from(LOGO_BUCKET).remove([logoObjectPath(user.id, companyId)]);
  await supabase.storage.from(BROCHURE_BUCKET).remove([brochureObjectPath(user.id, companyId)]);

  const { data, error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "That company is already gone. Refresh the page to see the current list." };
  }

  refresh();
  return { ok: true };
}

export async function saveCompanyLogo(
  companyId: string,
  logoUrl: string,
): Promise<{ error: string } | { logoUrl: string }> {
  if (!idSchema.safeParse(companyId).success) {
    return { error: "That company could not be found." };
  }
  const { supabase, user } = await requireUser();

  const origin = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const expected = origin
    ? `${origin}/storage/v1/object/public/${LOGO_BUCKET}/${logoObjectPath(user.id, companyId)}`
    : null;
  if (!expected || logoUrl.split("?")[0] !== expected) {
    return { error: "That logo could not be saved." };
  }

  const { data, error } = await supabase
    .from("companies")
    .update({ logo_url: logoUrl })
    .eq("id", companyId)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "That company could not be found." };
  }

  refresh(companyId);
  return { logoUrl };
}

export async function removeCompanyLogo(companyId: string): Promise<CompanyRemoveResult> {
  if (!idSchema.safeParse(companyId).success) {
    return { error: "That company could not be found." };
  }
  const { supabase, user } = await requireUser();

  const { error: removeError } = await supabase.storage
    .from(LOGO_BUCKET)
    .remove([logoObjectPath(user.id, companyId)]);
  if (removeError) {
    return { error: removeError.message };
  }

  const { error } = await supabase.from("companies").update({ logo_url: null }).eq("id", companyId);
  if (error) {
    return { error: error.message };
  }

  refresh(companyId);
  return { ok: true };
}

export async function saveCompanyBrochure(
  companyId: string,
  file: { name: string; size: number },
): Promise<{ error: string } | { brochure: { name: string; size: number } }> {
  if (!idSchema.safeParse(companyId).success) {
    return { error: "That company could not be found." };
  }
  if (!Number.isInteger(file.size) || file.size <= 0 || file.size > BROCHURE_MAX_BYTES) {
    return { error: "Keep the brochure under 10 MB." };
  }
  const name = file.name.trim().slice(0, 200) || "Brochure.pdf";

  const { supabase, user } = await requireUser();

  // The path is fixed, so confirm the upload actually landed before pointing at it.
  const { data: listed, error: listError } = await supabase.storage
    .from(BROCHURE_BUCKET)
    .list(`${user.id}/${companyId}`, { search: "brochure" });
  if (listError || !(listed ?? []).some((entry) => entry.name === "brochure")) {
    return { error: "The brochure did not upload. Try again." };
  }

  const { data, error } = await supabase
    .from("companies")
    .update({
      brochure_path: brochureObjectPath(user.id, companyId),
      brochure_name: name,
      brochure_size: file.size,
    })
    .eq("id", companyId)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "That company could not be found." };
  }

  refresh(companyId);
  return { brochure: { name, size: file.size } };
}

export async function removeCompanyBrochure(companyId: string): Promise<CompanyRemoveResult> {
  if (!idSchema.safeParse(companyId).success) {
    return { error: "That company could not be found." };
  }
  const { supabase, user } = await requireUser();

  const { error: removeError } = await supabase.storage
    .from(BROCHURE_BUCKET)
    .remove([brochureObjectPath(user.id, companyId)]);
  if (removeError) {
    return { error: removeError.message };
  }

  const { error } = await supabase
    .from("companies")
    .update({ brochure_path: null, brochure_name: null, brochure_size: null })
    .eq("id", companyId);
  if (error) {
    return { error: error.message };
  }

  refresh(companyId);
  return { ok: true };
}
