"use client";

import { ChevronLeft, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryPath, notesInScope, parseScope, scopeParam } from "./categories";
import { displayTitle, formatUpdated } from "./labels";
import type { NoteCategory, NoteListItem } from "./types";
import { useNewNote } from "./use-new-note";

export function NoteListPanel({
  notes,
  categories,
  scopeValue,
}: {
  notes: NoteListItem[];
  categories: NoteCategory[];
  scopeValue: string | null;
}) {
  const [query, setQuery] = useState("");
  const scope = parseScope(scopeValue, categories);
  const param = scopeParam(scope);
  const { creating, error, create } = useNewNote(scope);

  const inScope = notesInScope(notes, scope, categories);
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? inScope.filter((note) => `${note.title} ${note.preview}`.toLowerCase().includes(needle))
    : inScope;

  const heading =
    scope.kind === "all"
      ? "All notes"
      : scope.kind === "none"
        ? "No category"
        : (categoryPath(categories, scope.id).at(-1) ?? "Category");
  const trail = scope.kind === "category" ? categoryPath(categories, scope.id).slice(0, -1) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Link
        href="/notes"
        className="mb-1 inline-flex min-h-11 w-fit items-center gap-1 text-sm text-muted-foreground md:hidden"
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
        Notes
      </Link>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {trail.length > 0 ? (
            <p className="text-xs break-words text-muted-foreground">{trail.join(" / ")}</p>
          ) : null}
          <h2 className="text-[1.5rem] font-semibold tracking-tight break-words md:text-[1.75rem]">
            {heading}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {inScope.length === 1 ? "1 note" : `${inScope.length} notes`}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 shrink-0 px-3 md:hidden"
          disabled={creating}
          onClick={() => void create()}
        >
          <Plus className="size-4" aria-hidden="true" />
          {creating ? "Adding a note" : "New note"}
        </Button>
      </div>

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      {inScope.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center">
          <p className="max-w-prose text-sm text-muted-foreground">
            {scope.kind === "all"
              ? "Personal documents stay here."
              : "No notes here yet. Add one to start this category."}
          </p>
          <Button
            type="button"
            className="mt-4 min-h-11 w-fit px-4"
            disabled={creating}
            onClick={() => void create()}
          >
            <Plus className="size-4" aria-hidden="true" />
            {creating ? "Adding a note" : "New note"}
          </Button>
        </div>
      ) : (
        <>
          <label className="relative my-4 block max-w-md">
            <span className="sr-only">Search notes</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="pl-8"
            />
          </label>
          {visible.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">No notes match that search.</p>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto">
              {visible.map((note) => {
                const where =
                  scope.kind === "category" && note.categoryId === scope.id
                    ? null
                    : categoryPath(categories, note.categoryId).join(" / ") || null;
                return (
                  <li key={note.id}>
                    <Link
                      href={`/notes/${note.id}?category=${encodeURIComponent(param)}`}
                      className={cn(
                        "block min-h-14 border-b border-border px-1 py-3 hover:bg-foreground/[0.03]",
                      )}
                    >
                      <p className="text-sm font-medium break-words">{displayTitle(note.title)}</p>
                      {where ? (
                        <p className="mt-0.5 text-xs break-words text-muted-foreground">{where}</p>
                      ) : null}
                      {note.preview ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {note.preview}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatUpdated(note.updatedAt)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
