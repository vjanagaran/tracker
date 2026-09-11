"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function HashSessionCatcher({ next = "/invite/accept" }: { next?: string }) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) {
      return;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const supabase = createClient();

    void (async () => {
      if (accessToken && refreshToken) {
        await supabase.auth.signOut({ scope: "local" });
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          return;
        }
      }
      window.history.replaceState(null, "", window.location.pathname);
      router.replace(next);
      router.refresh();
    })();
  }, [next, router]);

  return null;
}
