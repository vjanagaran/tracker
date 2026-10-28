export const BOARD_TABS = [
  { id: "members", label: "Members" },
  { id: "meetings", label: "Meetings" },
  { id: "goals", label: "Goals" },
] as const;

export type BoardTab = (typeof BOARD_TABS)[number]["id"];

export function parseBoardTab(value: string | undefined): BoardTab {
  return BOARD_TABS.find((tab) => tab.id === value)?.id ?? "members";
}

/** The address of a board screen. Members is the default tab, so it carries no tab. */
export function boardHref(
  boardId: string,
  options: { tab?: BoardTab; memberId?: string } = {},
) {
  const params = new URLSearchParams();
  if (options.tab && options.tab !== "members") {
    params.set("tab", options.tab);
  }
  if (options.memberId) {
    params.set("member", options.memberId);
  }
  const query = params.toString();
  return query ? `/boards/${boardId}?${query}` : `/boards/${boardId}`;
}
