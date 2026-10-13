import { INITIAL_SCOPE, nodeKey, TASK_WHEN, type TaskNode, type TaskScope } from "./scope.ts";
import type { TaskTreeWheel } from "./types";

export type TaskLayout = "list" | "board" | "week" | "calendar";

export type ViewState = {
  scope: TaskScope;
  layout: TaskLayout;
  /** Meeting mode: bigger rows, nothing else on the screen. */
  present: boolean;
};

export const INITIAL_VIEW: ViewState = { scope: INITIAL_SCOPE, layout: "list", present: false };

/** A tree row from its key, or null if the tree has no such row. */
export function nodeFromKey(key: string | null, tree: readonly TaskTreeWheel[]): TaskNode | null {
  if (!key) {
    return null;
  }
  const [kind, id] = key.split(":");
  for (const wheel of tree) {
    if ((kind === "wheel" || kind === "unlinked") && id === wheel.type) {
      return { kind, wheel: wheel.type };
    }
    for (const spoke of wheel.spokes) {
      if (kind === "spoke" && id === spoke.id) {
        return { kind: "spoke", id };
      }
      if (kind === "focus" && spoke.focusAreas.some((focus) => focus.id === id)) {
        return { kind: "focus", id };
      }
    }
  }
  return null;
}

/**
 * Settles choices that contradict each other: closed lists have no date view or
 * layout, and the week and calendar layouts are themselves date views.
 */
export function normaliseView(state: ViewState): ViewState {
  const { scope } = state;
  if (scope.view !== "open") {
    return { ...state, scope: { ...scope, when: "all" }, layout: "list" };
  }
  if ((state.layout === "week" || state.layout === "calendar") && scope.when !== "all") {
    return { ...state, layout: "list" };
  }
  return state;
}

/** Reads the view from the address. Anything unknown falls back to the default. */
export function parseViewState(
  params: { get(name: string): string | null },
  tree: readonly TaskTreeWheel[],
): ViewState {
  const viewParam = params.get("view");
  const view = viewParam === "completed" || viewParam === "cancelled" ? viewParam : "open";

  const whenParam = params.get("when");
  const when = TASK_WHEN.find((option) => option === whenParam) ?? "all";

  const layoutParam = params.get("layout");
  const layout: TaskLayout =
    layoutParam === "board" || layoutParam === "week" || layoutParam === "calendar"
      ? layoutParam
      : "list";

  return normaliseView({
    scope: { view, when, node: nodeFromKey(params.get("node"), tree) },
    layout,
    present: params.get("present") === "1",
  });
}

/** The query string for a view, empty when it is the default. */
export function viewStateSearch(state: ViewState): string {
  const query = new URLSearchParams();
  if (state.scope.view !== "open") query.set("view", state.scope.view);
  if (state.scope.when !== "all") query.set("when", state.scope.when);
  if (state.scope.node) query.set("node", nodeKey(state.scope.node));
  if (state.layout !== "list") query.set("layout", state.layout);
  if (state.present) query.set("present", "1");
  const text = query.toString();
  return text ? `?${text}` : "";
}
