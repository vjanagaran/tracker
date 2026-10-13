import type { NoteCategory, NoteCategoryNode, NoteListItem } from "./types";

export const CATEGORY_MAX_LENGTH = 60;

/** The two built-in views that sit above the tree. */
export const SCOPE_ALL = "all";
export const SCOPE_NONE = "none";

export type NoteScope =
  | { kind: "all" }
  | { kind: "none" }
  | { kind: "category"; id: string };

export function normalizeCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function bySortOrder(a: NoteCategory, b: NoteCategory) {
  if (a.sortOrder !== b.sortOrder) {
    return a.sortOrder - b.sortOrder;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}

/** Siblings ordered by sort_order, then name. A parent that is missing is treated as the root. */
export function buildCategoryTree(categories: readonly NoteCategory[]): NoteCategoryNode[] {
  const known = new Set(categories.map((category) => category.id));
  const byParent = new Map<string | null, NoteCategory[]>();

  for (const category of categories) {
    const key = category.parentId && known.has(category.parentId) ? category.parentId : null;
    const bucket = byParent.get(key);
    if (bucket) {
      bucket.push(category);
    } else {
      byParent.set(key, [category]);
    }
  }

  function walk(parentId: string | null, depth: number, seen: Set<string>): NoteCategoryNode[] {
    return (byParent.get(parentId) ?? [])
      .slice()
      .sort(bySortOrder)
      .filter((category) => !seen.has(category.id))
      .map((category) => {
        const next = new Set(seen).add(category.id);
        return { ...category, depth, children: walk(category.id, depth + 1, next) };
      });
  }

  return walk(null, 0, new Set());
}

/** The tree in reading order, skipping the children of anything collapsed. */
export function visibleCategories(
  tree: readonly NoteCategoryNode[],
  collapsed: ReadonlySet<string>,
): NoteCategoryNode[] {
  const rows: NoteCategoryNode[] = [];
  function walk(nodes: readonly NoteCategoryNode[]) {
    for (const node of nodes) {
      rows.push(node);
      if (!collapsed.has(node.id)) {
        walk(node.children);
      }
    }
  }
  walk(tree);
  return rows;
}

export function flattenCategories(tree: readonly NoteCategoryNode[]): NoteCategoryNode[] {
  return visibleCategories(tree, new Set());
}

export function descendantIds(categories: readonly NoteCategory[], id: string): Set<string> {
  const children = new Map<string, string[]>();
  for (const category of categories) {
    if (category.parentId) {
      const bucket = children.get(category.parentId);
      if (bucket) {
        bucket.push(category.id);
      } else {
        children.set(category.parentId, [category.id]);
      }
    }
  }

  const found = new Set<string>();
  const queue = [id];
  while (queue.length > 0) {
    const current = queue.pop() as string;
    for (const child of children.get(current) ?? []) {
      if (!found.has(child)) {
        found.add(child);
        queue.push(child);
      }
    }
  }
  return found;
}

/** Names from the top of the tree down to this category. */
export function categoryPath(categories: readonly NoteCategory[], id: string | null): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const names: string[] = [];
  const seen = new Set<string>();
  let current = id ? byId.get(id) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return names;
}

export function ancestorIds(categories: readonly NoteCategory[], id: string): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const ids: string[] = [];
  const seen = new Set<string>([id]);
  let current = byId.get(id)?.parentId ? byId.get(byId.get(id)?.parentId as string) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    ids.unshift(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return ids;
}

/** How many notes sit in each category, counting its subcategories. */
export function rollupCounts(
  categories: readonly NoteCategory[],
  notes: readonly Pick<NoteListItem, "categoryId">[],
): Map<string, number> {
  const direct = new Map<string, number>();
  for (const note of notes) {
    if (note.categoryId) {
      direct.set(note.categoryId, (direct.get(note.categoryId) ?? 0) + 1);
    }
  }

  const counts = new Map<string, number>();
  for (const category of categories) {
    let total = direct.get(category.id) ?? 0;
    for (const id of descendantIds(categories, category.id)) {
      total += direct.get(id) ?? 0;
    }
    counts.set(category.id, total);
  }
  return counts;
}

export function parseScope(value: string | null | undefined, categories: readonly NoteCategory[]): NoteScope {
  if (value === SCOPE_NONE) {
    return { kind: "none" };
  }
  if (value && categories.some((category) => category.id === value)) {
    return { kind: "category", id: value };
  }
  return { kind: "all" };
}

export function scopeParam(scope: NoteScope): string {
  if (scope.kind === "none") return SCOPE_NONE;
  if (scope.kind === "category") return scope.id;
  return SCOPE_ALL;
}

export function notesInScope<T extends Pick<NoteListItem, "categoryId">>(
  notes: readonly T[],
  scope: NoteScope,
  categories: readonly NoteCategory[],
): T[] {
  if (scope.kind === "all") {
    return [...notes];
  }
  if (scope.kind === "none") {
    return notes.filter((note) => note.categoryId == null);
  }
  const ids = descendantIds(categories, scope.id).add(scope.id);
  return notes.filter((note) => note.categoryId != null && ids.has(note.categoryId));
}

/** Indented options for a parent or category picker. */
export function categoryOptions(
  categories: readonly NoteCategory[],
  excludeIds: ReadonlySet<string> = new Set(),
): { id: string; label: string; depth: number }[] {
  return flattenCategories(buildCategoryTree(categories))
    .filter((node) => !excludeIds.has(node.id))
    .map((node) => ({
      id: node.id,
      label: categoryPath(categories, node.id).join(" / "),
      depth: node.depth,
    }));
}

/** Where a category sits among its siblings, for the move controls. */
export function siblingPosition(
  categories: readonly NoteCategory[],
  id: string,
): { index: number; count: number } {
  const target = categories.find((category) => category.id === id);
  if (!target) {
    return { index: 0, count: 0 };
  }
  const siblings = categories
    .filter((category) => (category.parentId ?? null) === (target.parentId ?? null))
    .sort(bySortOrder);
  return { index: siblings.findIndex((category) => category.id === id), count: siblings.length };
}
