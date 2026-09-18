"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function InviteSessionGate({ setupSession }: { setupSession: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      return;
    }
    if (!setupSession) {
      router.replace("/dashboard");
    }
  }, [setupSession, router]);

  return null;
}
