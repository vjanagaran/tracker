import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import { previewFromText } from "./body";
import { SIGNED_URL_SECONDS } from "./schema";
import type { NoteDetail, NoteFile, NoteListItem } from "./types";

type Client = SupabaseClient<Database>;

export async function loadNoteList(client: Client, userId: string): Promise<NoteListItem[]> {
  const { data, error } = await client
    .from("notes")
    .select("id, title, body_text, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    preview: previewFromText(row.body_text),
    updatedAt: row.updated_at,
  }));
}

export async function loadNote(
  client: Client,
  userId: string,
  noteId: string,
): Promise<NoteDetail | null> {
  const { data, error } = await client
    .from("notes")
    .select("id, title, body, updated_at")
    .eq("user_id", userId)
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }

  const files = await loadNoteFiles(client, noteId);

  return {
    id: data.id,
    title: data.title,
    body: data.body,
    updatedAt: data.updated_at,
    files,
  };
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
