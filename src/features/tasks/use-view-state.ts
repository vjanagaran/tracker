"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { normaliseView, parseViewState, viewStateSearch, type ViewState } from "./url";
import type { TaskTreeWheel } from "./types";

/**
 * The tasks view lives in the address, so a view can be linked to, reloaded
 * and walked back through. Changes use the History API directly, which keeps
 * the page in place instead of asking the server for it again.
 */
export function useViewState(tree: TaskTreeWheel[]) {
  const params = useSearchParams();
  const pathname = usePathname();
  const state = parseViewState(params, tree);

  function setState(next: ViewState) {
    window.history.pushState(null, "", `${pathname}${viewStateSearch(normaliseView(next))}`);
  }

  return [state, setState] as const;
}
