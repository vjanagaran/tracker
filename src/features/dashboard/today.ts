import { isoDay } from "./bucket";

/**
 * The browser's calendar day, read as an external store so a component can
 * render the server's day first and the member's own day after hydration
 * without a mismatch. Nothing notifies, so a tab left open across midnight
 * keeps yesterday until it is reloaded.
 */
let cached = "";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  const day = isoDay(new Date());
  if (day !== cached) {
    cached = day;
  }
  return cached;
}

export const todayStore = { subscribe, getSnapshot };
