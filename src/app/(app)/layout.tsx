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
    <div className="flex min-h-dvh overflow-x-hidden">
      <SidebarNav
        name={profile?.full_name ?? ""}
        isSuperadmin={profile?.is_superadmin ?? false}
        boards={boards}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader name={profile?.full_name ?? ""} />
        <main
          id="main"
          className="min-w-0 flex-1 overflow-x-hidden px-5 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:py-9 md:pb-10"
        >
          <Providers>{children}</Providers>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
