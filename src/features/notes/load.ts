import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import { previewFromText } from "./body";
import { SIGNED_URL_SECONDS } from "./schema";
import type {
  NoteCategory,
  NoteComment,
  NoteDetail,
  NoteFile,
  NoteListItem,
} from "./types";

type Client = SupabaseClient<Database>;

export const NOTE_LIST_COLUMNS = "id, title, category_id, body_text, updated_at" as const;

export function toNoteListItem(row: {
  id: string;
  title: string;
  category_id: string | null;
  body_text: string;
  updated_at: string;
}): NoteListItem {
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    preview: previewFromText(row.body_text),
    updatedAt: row.updated_at,
  };
}

export async function loadNoteList(
  client: Client,
  userId: string,
  limit?: number,
): Promise<NoteListItem[]> {
  let query = client
    .from("notes")
    .select(NOTE_LIST_COLUMNS)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (limit != null) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toNoteListItem);
}

export async function loadCategories(client: Client, userId: string): Promise<NoteCategory[]> {
  const { data, error } = await client
    .from("note_categories")
    .select("id, parent_id, name, sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function loadNoteCategoryIds(
  client: Client,
  userId: string,
): Promise<{ categoryId: string | null }[]> {
  const { data, error } = await client
    .from("notes")
    .select("category_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({ categoryId: row.category_id }));
}

export async function loadNote(
  client: Client,
  userId: string,
  noteId: string,
): Promise<NoteDetail | null> {
  const { data, error } = await client
    .from("notes")
    .select("id, title, category_id, body, updated_at")
    .eq("user_id", userId)
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const [files, comments] = await Promise.all([
    loadNoteFiles(client, noteId),
    loadNoteComments(client, noteId),
  ]);

  return {
    id: data.id,
    title: data.title,
    categoryId: data.category_id,
    body: data.body,
    updatedAt: data.updated_at,
    files,
    comments,
  };
}

async function loadNoteComments(client: Client, noteId: string): Promise<NoteComment[]> {
  const { data, error } = await client
    .from("note_comments")
    .select("id, comment, created_at")
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    comment: row.comment,
    createdAt: row.created_at,
  }));
}

async function loadNoteFiles(client: Client, noteId: string): Promise<NoteFile[]> {
  const { data, error } = await client
    .from("note_files")
    .select("id, kind, original_name, mime_type, size_bytes, storage_path, created_at")
    .eq("note_id", noteId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const paths = rows.map((row) => row.storage_path);
  const urls = new Map<string, string>();

  if (paths.length > 0) {
    const { data: signed, error: signedError } = await client.storage
      .from("notes")
      .createSignedUrls(paths, SIGNED_URL_SECONDS);
    if (signedError) {
      throw new Error(signedError.message);
    }
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) {
        urls.set(item.path, item.signedUrl);
      }
    }
  }

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    name: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    signedUrl: urls.get(row.storage_path) ?? null,
    createdAt: row.created_at,
  }));
}

export function emptyBody(): Json {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}
