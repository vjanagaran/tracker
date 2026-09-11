import { MobileHeader } from "@/components/mobile-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { Providers } from "@/components/providers";
import { SidebarNav } from "@/components/sidebar-nav";
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
    .select("full_name, is_superadmin")
    .eq("id", user.id)
    .maybeSingle();
  const boards = await loadMemberBoards(supabase, user.id);

  return (
    <div className="flex min-h-dvh">
      <SidebarNav
        name={profile?.full_name ?? ""}
        isSuperadmin={profile?.is_superadmin ?? false}
        boards={boards}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader name={profile?.full_name ?? ""} />
        <main
          id="main"
          className="flex-1 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:py-8 md:pb-8"
        >
          <Providers>{children}</Providers>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
