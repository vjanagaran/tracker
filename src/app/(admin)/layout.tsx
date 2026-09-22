import { AppShell } from "@/components/app-shell";
import { loadMemberBoards } from "@/features/boards/load";
import { requireSuperadmin } from "@/lib/auth/require-superadmin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireSuperadmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, photo_url")
    .eq("id", user.id)
    .maybeSingle();
  const boards = await loadMemberBoards(supabase, user.id);

  return (
    <AppShell
      name={profile?.full_name ?? ""}
      photoUrl={profile?.photo_url ?? null}
      isSuperadmin
      boards={boards}
    >
      {children}
    </AppShell>
  );
}
