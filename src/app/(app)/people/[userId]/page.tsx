import { notFound } from "next/navigation";
import { loadCompaniesOf } from "@/features/companies/load";
import { ProfileView } from "@/features/profile/profile-view";
import { canViewProfile, loadPublicProfile } from "@/features/profile/load";
import { requireUser } from "@/lib/auth/require-user";

type PersonPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function PersonPage({ params }: PersonPageProps) {
  const { userId } = await params;
  const { supabase, user } = await requireUser();

  if (!(await canViewProfile(supabase, user.id, userId))) {
    notFound();
  }

  const profile = await loadPublicProfile(supabase, userId);
  if (!profile) {
    notFound();
  }

  // Row-level security keeps back any company its owner has not shared.
  const companies = await loadCompaniesOf(supabase, userId);

  return <ProfileView profile={profile} isOwn={user.id === userId} companies={companies} />;
}
