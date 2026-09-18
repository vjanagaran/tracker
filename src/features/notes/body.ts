import type { JSONContent } from "@tiptap/react";
import type { Json } from "@/lib/database.types";
import { EMPTY_NOTE_BODY } from "./schema";

type DocNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
};

export function asEditorDoc(body: Json): JSONContent {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return structuredClone(EMPTY_NOTE_BODY) as unknown as JSONContent;
  }
  return body as JSONContent;
}

export function bodyTextFromDoc(body: Json): string {
  const parts: string[] = [];
  walkText(asEditorDoc(body) as DocNode, parts);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

export function previewFromText(text: string) {
  if (!text) {
    return "";
  }
  return text.length > 90 ? `${text.slice(0, 90).trimEnd()}…` : text;
}

export function persistableBody(body: Json): Json {
  const doc = structuredClone(asEditorDoc(body)) as DocNode;
  stripImageSrc(doc);
  return doc as Json;
}

export function hydrateBody(body: Json, urls: Record<string, string>): JSONContent {
  const doc = structuredClone(asEditorDoc(body)) as DocNode;
  applyImageSrc(doc, urls);
  return doc as JSONContent;
}

function walkText(node: DocNode, parts: string[]) {
  if (node.text) {
    parts.push(node.text);
  }
  for (const child of node.content ?? []) {
    walkText(child, parts);
  }
}

function stripImageSrc(node: DocNode) {
  if (node.type === "image") {
    const fileId = typeof node.attrs?.fileId === "string" ? node.attrs.fileId : null;
    node.attrs = fileId ? { fileId } : {};
  }
  for (const child of node.content ?? []) {
    stripImageSrc(child);
  }
}

function applyImageSrc(node: DocNode, urls: Record<string, string>) {
  if (node.type === "image") {
    const fileId = typeof node.attrs?.fileId === "string" ? node.attrs.fileId : null;
    node.attrs = {
      ...(node.attrs ?? {}),
      src: fileId && urls[fileId] ? urls[fileId] : "",
    };
  }
  for (const child of node.content ?? []) {
    applyImageSrc(child, urls);
  }
}
