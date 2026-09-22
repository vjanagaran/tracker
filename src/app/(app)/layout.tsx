import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import { loadMemberBoards } from "@/features/boards/load";
import { requireUser } from "@/lib/auth/require-user";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, photo_url, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();
  const boards = await loadMemberBoards(supabase, user.id);

  return (
    <AppShell
      name={profile?.full_name ?? ""}
      photoUrl={profile?.photo_url ?? null}
      isSuperadmin={profile?.is_superadmin ?? false}
      boards={boards}
    >
      <Providers>{children}</Providers>
    </AppShell>
  );
}
