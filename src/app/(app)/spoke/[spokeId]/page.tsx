import { notFound } from "next/navigation";
import { loadSpokeDetail } from "@/features/spoke/load";
import { SpokeDetailView } from "@/features/spoke/spoke-detail";
import { requireUser } from "@/lib/auth/require-user";

type SpokePageProps = {
  params: Promise<{ spokeId: string }>;
};

export default async function SpokePage({ params }: SpokePageProps) {
  const { spokeId } = await params;
  const { supabase, user } = await requireUser();
  const spoke = await loadSpokeDetail(supabase, user.id, spokeId);

  if (!spoke) {
    notFound();
  }

  return <SpokeDetailView spoke={spoke} />;
}
