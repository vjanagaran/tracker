"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function LandingRedirect() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const supabase = createClient();
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session) {
          window.history.replaceState(null, "", window.location.pathname);
          router.replace("/invite/accept");
          router.refresh();
          return;
        }
        router.replace("/sign-in");
      });
      return;
    }
    router.replace("/sign-in");
  }, [router]);

  return (
    <p className="text-sm text-muted-foreground">Opening Personal Board.</p>
  );
}
