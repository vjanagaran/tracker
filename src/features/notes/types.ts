import type { Json } from "@/lib/database.types";

export type NoteFileKind = "inline" | "attachment";

export type NoteCategory = {
  id: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
};

export type NoteCategoryNode = NoteCategory & {
  depth: number;
  children: NoteCategoryNode[];
};

export type NoteListItem = {
  id: string;
  title: string;
  categoryId: string | null;
  preview: string;
  updatedAt: string;
};

export type NoteFile = {
  id: string;
  kind: NoteFileKind;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  signedUrl: string | null;
  createdAt: string;
};

export type NoteComment = {
  id: string;
  comment: string;
  createdAt: string;
};

export type NoteDetail = {
  id: string;
  title: string;
  categoryId: string | null;
  body: Json;
  updatedAt: string;
  files: NoteFile[];
  comments: NoteComment[];
};
