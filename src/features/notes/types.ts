import type { Json } from "@/lib/database.types";

export type NoteFileKind = "inline" | "attachment";

export type NoteListItem = {
  id: string;
  title: string;
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

export type NoteDetail = {
  id: string;
  title: string;
  body: Json;
  updatedAt: string;
  files: NoteFile[];
};
