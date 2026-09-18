import { notFound } from "next/navigation";
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

  return <ProfileView profile={profile} isOwn={user.id === userId} />;
}
