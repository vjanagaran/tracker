"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createNote } from "./actions";
import { scopeParam, type NoteScope } from "./categories";

/** Adds a note to the current category and opens it for writing. */
export function useNewNote(scope: NoteScope | null) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setCreating(true);
    setError(null);
    const categoryId = scope?.kind === "category" ? scope.id : null;
    const result = await createNote({ categoryId });
    setCreating(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    const from = scope ? `&category=${encodeURIComponent(scopeParam(scope))}` : "";
    router.push(`/notes/${result.note.id}?edit=1${from}`);
  }

  return { creating, error, create };
}
