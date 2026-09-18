import type { Metadata } from "next";
import { Dashboard } from "@/features/dashboard/dashboard";
import { loadDashboard } from "@/features/dashboard/load";
import { requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const view = await loadDashboard(supabase, user.id);

  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <Dashboard view={view} />
    </>
  );
}
