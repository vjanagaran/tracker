"use server";

import { requireUser } from "@/lib/auth/require-user";
import { refreshNotes } from "./refresh";
import {
  createCategorySchema,
  moveCategorySchema,
  noteIdSchema,
  updateCategorySchema,
} from "./schema";
import type { NoteCategory } from "./types";

export type CategoryActionResult = { error: string } | { ok: true; category: NoteCategory };
export type CategoryDoneResult = { error: string } | { ok: true };

type Client = Awaited<ReturnType<typeof requireUser>>["supabase"];

const CATEGORY_COLUMNS = "id, parent_id, name, description, sort_order" as const;

function toCategory(row: {
  id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  sort_order: number;
}): NoteCategory {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

function writeError(error: { code?: string; message: string }, fallback: string) {
  if (error.code === "23505") {
    return "A category with that name already exists there. Choose another name.";
  }
  return error.message || fallback;
}

async function nextSortOrder(
  client: Client,
  userId: string,
  parentId: string | null,
): Promise<{ error: string } | { order: number }> {
  let query = client
    .from("note_categories")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1);

  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);

  const { data, error } = await query;
  if (error) {
    return { error: error.message };
  }
  return { order: (data?.[0]?.sort_order ?? -1) + 1 };
}

export async function createCategory(input: unknown): Promise<CategoryActionResult> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "The category could not be added." };
  }

  const { supabase, user } = await requireUser();
  const next = await nextSortOrder(supabase, user.id, parsed.data.parentId);
  if ("error" in next) {
    return next;
  }

  const { data, error } = await supabase
    .from("note_categories")
    .insert({
      user_id: user.id,
      parent_id: parsed.data.parentId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      sort_order: next.order,
    })
    .select(CATEGORY_COLUMNS)
    .single();

  if (error || !data) {
    return { error: error ? writeError(error, "The category could not be added.") : "The category could not be added." };
  }

  refreshNotes();
  return { ok: true, category: toCategory(data) };
}

export async function updateCategory(input: unknown): Promise<CategoryActionResult> {
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "The category could not be saved." };
  }

  const { supabase, user } = await requireUser();
  const { data: current, error: currentError } = await supabase
    .from("note_categories")
    .select("parent_id")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (currentError || !current) {
    return { error: currentError?.message ?? "That category no longer exists." };
  }

  const changes: {
    name: string;
    description: string | null;
    parent_id: string | null;
    sort_order?: number;
  } = {
    name: parsed.data.name,
    description: parsed.data.description || null,
    parent_id: parsed.data.parentId,
  };

  if ((current.parent_id ?? null) !== parsed.data.parentId) {
    const next = await nextSortOrder(supabase, user.id, parsed.data.parentId);
    if ("error" in next) {
      return next;
    }
    changes.sort_order = next.order;
  }

  const { data, error } = await supabase
    .from("note_categories")
    .update(changes)
    .eq("id", parsed.data.id)
    .select(CATEGORY_COLUMNS)
    .single();

  if (error || !data) {
    return { error: error ? writeError(error, "The category could not be saved.") : "The category could not be saved." };
  }

  refreshNotes();
  return { ok: true, category: toCategory(data) };
}

export async function moveCategory(input: unknown): Promise<CategoryDoneResult> {
  const parsed = moveCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That category could not be moved." };
  }

  const { supabase, user } = await requireUser();
  const { data: target, error: targetError } = await supabase
    .from("note_categories")
    .select("parent_id")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (targetError || !target) {
    return { error: targetError?.message ?? "That category no longer exists." };
  }

  let query = supabase
    .from("note_categories")
    .select("id, sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  query = target.parent_id ? query.eq("parent_id", target.parent_id) : query.is("parent_id", null);

  const { data: siblings, error: siblingsError } = await query;
  if (siblingsError) {
    return { error: siblingsError.message };
  }

  const ids = (siblings ?? []).map((row) => row.id);
  const from = ids.indexOf(parsed.data.id);
  const to = parsed.data.direction === "up" ? from - 1 : from + 1;
  if (from === -1 || to < 0 || to >= ids.length) {
    return { ok: true };
  }

  const [moved] = ids.splice(from, 1);
  ids.splice(to, 0, moved);

  const current = new Map((siblings ?? []).map((row) => [row.id, row.sort_order]));
  const writes = ids
    .map((id, index) => ({ id, index }))
    .filter(({ id, index }) => current.get(id) !== index);

  const results = await Promise.all(
    writes.map(({ id, index }) =>
      supabase.from("note_categories").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { error: failed.error.message };
  }

  refreshNotes();
  return { ok: true };
}

export async function deleteCategory(input: unknown): Promise<CategoryDoneResult> {
  const parsed = noteIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That category could not be deleted." };
  }

  const { supabase, user } = await requireUser();
  const { count, error: countError } = await supabase
    .from("note_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("parent_id", parsed.data.id);

  if (countError) {
    return { error: countError.message };
  }
  if ((count ?? 0) > 0) {
    return { error: "This category has subcategories. Move or delete them first." };
  }

  const { data, error } = await supabase
    .from("note_categories")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }
  if (!data) {
    return { error: "That category no longer exists." };
  }

  refreshNotes();
  return { ok: true };
}
