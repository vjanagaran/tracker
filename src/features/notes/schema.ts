import { z } from "zod";
import type { Json } from "@/lib/database.types";
import { CATEGORY_DESCRIPTION_MAX_LENGTH, CATEGORY_MAX_LENGTH } from "./categories";

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

export const createNoteSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
});

export const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.unknown(),
  categoryId: z.string().uuid().nullable(),
});

export const moveNoteSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
});

export const noteIdSchema = z.object({
  id: z.string().uuid(),
});

const categoryName = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(1, "Name the category.")
      .max(CATEGORY_MAX_LENGTH, "Keep the name to 60 characters."),
  );

const categoryDescription = z
  .string()
  .trim()
  .max(CATEGORY_DESCRIPTION_MAX_LENGTH, "Keep the description to 500 characters.")
  .nullable()
  .optional();

export const createCategorySchema = z.object({
  name: categoryName,
  description: categoryDescription,
  parentId: z.string().uuid().nullable(),
});

export const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: categoryName,
  description: categoryDescription,
  parentId: z.string().uuid().nullable(),
});

export const moveCategorySchema = z.object({
  id: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

export const addNoteCommentSchema = z.object({
  noteId: z.string().uuid(),
  comment: z.string().trim().min(1, "Write a comment."),
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
