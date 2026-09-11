import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/require-user";

export async function requireSuperadmin() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_superadmin) {
    notFound();
  }

  return { supabase, user };
}
