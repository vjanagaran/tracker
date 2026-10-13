"use client";

import { Plus } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { CategoryTree } from "./category-tree";
import { parseScope, type NoteScope } from "./categories";
import type { NoteCategory } from "./types";
import { useNewNote } from "./use-new-note";

type Counts = {
  all: number;
  none: number;
  byCategory: Record<string, number>;
};

/**
 * Lives in the notes layout so the tree keeps its expanded and collapsed
 * state while the right panel moves between a category's notes and one note.
 */
export function NotesShell({
  categories,
  counts,
  children,
}: {
  categories: NoteCategory[];
  counts: Counts;
  children: React.ReactNode;
}) {
  const params = useParams<{ noteId?: string }>();
  const search = useSearchParams();
  const noteOpen = Boolean(params.noteId);
  const categoryParam = search.get("category");

  // The note page carries the category it was opened from, so the tree can
  // keep that row marked. Opened directly, nothing is marked.
  const scope: NoteScope | null =
    categoryParam != null || !noteOpen ? parseScope(categoryParam, categories) : null;

  // On a phone the tree is the screen until a category or a note is opened.
  const treeOnly = !noteOpen && categoryParam == null;

  const { creating, error, create } = useNewNote(scope);

  return (
    <div className="-mx-5 -mt-6 flex min-h-[calc(100dvh-8.5rem)] flex-col md:-mx-10 md:-my-9 md:min-h-[calc(100dvh)] md:flex-row">
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-border px-5 md:flex md:w-72 md:border-r md:px-4 md:py-6",
          treeOnly ? "flex" : "hidden",
        )}
      >
        <div className="flex items-center justify-between gap-3 py-3 md:pt-0">
          <h1 className="text-lg font-semibold tracking-tight">Notes</h1>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 px-3"
            disabled={creating}
            onClick={() => void create()}
          >
            <Plus className="size-4" aria-hidden="true" />
            {creating ? "Adding a note" : "New note"}
          </Button>
        </div>
        {error ? <p className="mb-2 text-sm text-destructive">{error}</p> : null}
        <CategoryTree categories={categories} counts={counts} scope={scope} />
      </aside>
      <section
        className={cn(
          "min-w-0 flex-1 px-5 py-4 md:flex md:flex-col md:px-8 md:py-6",
          treeOnly ? "hidden" : "flex flex-col",
        )}
      >
        {children}
      </section>
    </div>
  );
}
