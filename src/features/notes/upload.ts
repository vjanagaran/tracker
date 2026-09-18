import { createClient } from "@/lib/supabase/client";
import { registerNoteFile } from "./actions";
import {
  FILE_MAX_BYTES,
  IMAGE_MAX_BYTES,
  IMAGE_MIME_TYPES,
  NOTE_BUCKET,
  noteObjectPath,
} from "./schema";
import type { NoteFile, NoteFileKind } from "./types";

const imageMime = new Set<string>(IMAGE_MIME_TYPES);

export async function uploadNoteFile(input: {
  noteId: string;
  file: File;
  kind: NoteFileKind;
}): Promise<{ error: string } | { file: NoteFile }> {
  const { noteId, file, kind } = input;
  if (file.size > FILE_MAX_BYTES) {
    return { error: "Keep each file under 20 MB." };
  }
  if (kind === "inline") {
    if (!imageMime.has(file.type)) {
      return { error: "Use a PNG, JPEG, WebP or GIF image." };
    }
    if (file.size > IMAGE_MAX_BYTES) {
      return { error: "Keep images under 10 MB." };
    }
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session ended. Sign in again." };
  }

  const fileId = crypto.randomUUID();
  const path = noteObjectPath(user.id, noteId, fileId);
  const { error: uploadError } = await supabase.storage.from(NOTE_BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) {
    return { error: uploadError.message };
  }

  return registerNoteFile({
    noteId,
    fileId,
    kind,
    name: file.name || "Untitled",
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  });
}
