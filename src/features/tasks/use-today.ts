"use client";

import { useSyncExternalStore } from "react";
import { localNow } from "@/features/morning-note/clock";

function subscribe(onChange: () => void) {
  // The date only changes at midnight; a slow tick is enough to notice it.
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
}

/**
 * The member's calendar day as YYYY-MM-DD. The server renders its own guess
 * first; the browser then reads its own clock, so a screen left open past
 * midnight moves to the new day.
 */
export function useToday(serverToday: string, timeZone: string | null) {
  return useSyncExternalStore(
    subscribe,
    () =>
      localNow(timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone, new Date()).isoDay,
    () => serverToday,
  );
}
