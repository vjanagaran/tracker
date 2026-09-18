import { z } from "zod";
import type { Json } from "@/lib/database.types";

export const NOTE_BUCKET = "notes";
export const FILE_MAX_BYTES = 20 * 1024 * 1024;
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const SIGNED_URL_SECONDS = 60 * 60;

export const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export const EMPTY_NOTE_BODY: Json = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.unknown(),
});

export const noteIdSchema = z.object({
  id: z.string().uuid(),
});

export const registerNoteFileSchema = z.object({
  noteId: z.string().uuid(),
  fileId: z.string().uuid(),
  kind: z.enum(["inline", "attachment"]),
  name: z.string().trim().min(1, "The file needs a name."),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.number().int().nonnegative().max(FILE_MAX_BYTES, "Keep each file under 20 MB."),
});

export const removeNoteFileSchema = z.object({
  noteId: z.string().uuid(),
  fileId: z.string().uuid(),
});

export function noteObjectPath(userId: string, noteId: string, fileId: string) {
  return `${userId}/${noteId}/${fileId}`;
}
