"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import type { Json } from "@/lib/database.types";
import { bodyTextFromDoc, persistableBody, previewFromText } from "./body";
import { emptyBody } from "./load";
import {
  NOTE_BUCKET,
  noteIdSchema,
  noteObjectPath,
  registerNoteFileSchema,
  removeNoteFileSchema,
  SIGNED_URL_SECONDS,
  updateNoteSchema,
} from "./schema";
import type { NoteDetail, NoteFile, NoteListItem } from "./types";

export type NoteActionResult = { error: string } | { ok: true; note: NoteListItem };
export type NoteDetailResult = { error: string } | { ok: true; note: NoteDetail };
export type NoteFileResult = { error: string } | { ok: true; file: NoteFile };
export type NoteDeleteResult = { error: string } | { ok: true };

function refreshNotes(noteId?: string) {
  revalidatePath("/notes");
  if (noteId) {
    revalidatePath(`/notes/${noteId}`);
  }
}

export async function createNote(): Promise<NoteActionResult> {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: "",
      body: emptyBody(),
      body_text: "",
    })
    .select("id, title, body_text, updated_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "The note could not be added." };
  }

  refreshNotes(data.id);
  return {
    ok: true,
    note: {
      id: data.id,
      title: data.title,
      preview: previewFromText(data.body_text),
      updatedAt: data.updated_at,
    },
  };
}

export async function saveNote(input: unknown): Promise<NoteActionResult> {
  const parsed = updateNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "The note could not be saved." };
  }

  const body = persistableBody(parsed.data.body as Json);
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("notes")
    .update({
      title: parsed.data.title,
      body,
      body_text: bodyTextFromDoc(body),
    })
    .eq("id", parsed.data.id)
    .select("id, title, body_text, updated_at")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "The note could not be saved." };
  }

  refreshNotes(data.id);
  return {
    ok: true,
    note: {
      id: data.id,
      title: data.title,
      preview: previewFromText(data.body_text),
      updatedAt: data.updated_at,
    },
  };
}

export async function deleteNote(input: unknown): Promise<NoteDeleteResult> {
  const parsed = noteIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That note could not be deleted." };
  }

  const { supabase, user } = await requireUser();
  const { data: files, error: filesError } = await supabase
    .from("note_files")
    .select("storage_path")
    .eq("note_id", parsed.data.id);

  if (filesError) {
    return { error: filesError.message };
  }

  const paths = (files ?? []).map((file) => file.storage_path);
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(NOTE_BUCKET).remove(paths);
    if (storageError) {
      return { error: storageError.message };
    }
  }

  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "The note could not be deleted." };
  }

  refreshNotes();
  return { ok: true };
}

export async function registerNoteFile(input: unknown): Promise<NoteFileResult> {
  const parsed = registerNoteFileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "The file could not be attached." };
  }

  const { supabase, user } = await requireUser();
  const path = noteObjectPath(user.id, parsed.data.noteId, parsed.data.fileId);
  const { data, error } = await supabase
    .from("note_files")
    .insert({
      id: parsed.data.fileId,
      note_id: parsed.data.noteId,
      kind: parsed.data.kind,
      original_name: parsed.data.name,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
      storage_path: path,
    })
    .select("id, kind, original_name, mime_type, size_bytes, storage_path, created_at")
    .single();

  if (error || !data) {
    await supabase.storage.from(NOTE_BUCKET).remove([path]);
    return { error: error?.message ?? "The file could not be attached." };
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(NOTE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);

  if (signedError) {
    return { error: signedError.message };
  }

  refreshNotes(parsed.data.noteId);
  return {
    ok: true,
    file: {
      id: data.id,
      kind: data.kind,
      name: data.original_name,
      mimeType: data.mime_type,
      sizeBytes: data.size_bytes,
      storagePath: data.storage_path,
      signedUrl: signed.signedUrl,
      createdAt: data.created_at,
    },
  };
}

export async function removeNoteFile(input: unknown): Promise<NoteDeleteResult> {
  const parsed = removeNoteFileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "That file could not be removed." };
  }

  const { supabase, user } = await requireUser();
  const path = noteObjectPath(user.id, parsed.data.noteId, parsed.data.fileId);
  const { error: storageError } = await supabase.storage.from(NOTE_BUCKET).remove([path]);
  if (storageError) {
    return { error: storageError.message };
  }

  const { error } = await supabase
    .from("note_files")
    .delete()
    .eq("id", parsed.data.fileId)
    .eq("note_id", parsed.data.noteId);

  if (error) {
    return { error: error.message };
  }

  refreshNotes(parsed.data.noteId);
  return { ok: true };
}
