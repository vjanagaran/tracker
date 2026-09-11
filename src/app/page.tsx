import { redirect } from "next/navigation";
import { LandingRedirect } from "@/features/auth/landing-redirect";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/tasks");
  }

  return (
    <main id="main" className="flex min-h-dvh items-center justify-center px-6">
      <LandingRedirect />
    </main>
  );
}
