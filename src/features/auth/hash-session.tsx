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

    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        return;
      }
      window.history.replaceState(null, "", window.location.pathname);
      router.replace(next);
      router.refresh();
    });
  }, [next, router]);

  return null;
}
