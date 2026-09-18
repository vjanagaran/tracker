"use client";

import Link from "next/link";
import { cn } from "cn";
import { displayTitle, formatUpdated } from "./labels";
import type { NoteListItem } from "./types";

export function NoteList({
  notes,
  selectedId,
  onSelect,
}: {
  notes: NoteListItem[];
  selectedId: string | null;
  onSelect?: (noteId: string) => void;
}) {
  if (notes.length === 0) {
    return (
      <p className="px-1 py-4 text-sm text-muted-foreground">Personal documents stay here.</p>
    );
  }

  return (
    <ul>
      {notes.map((note) => {
        const active = note.id === selectedId;
        return (
          <li key={note.id}>
            <Link
              href={`/notes/${note.id}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "block min-h-14 border-b border-border px-1 py-3",
                active ? "bg-accent" : "hover:bg-foreground/[0.03]",
              )}
              onClick={() => onSelect?.(note.id)}
            >
              <p className="text-sm font-medium break-words">{displayTitle(note.title)}</p>
              {note.preview ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{note.preview}</p>
              ) : null}
              <p className="mt-1 text-xs text-muted-foreground">{formatUpdated(note.updatedAt)}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
