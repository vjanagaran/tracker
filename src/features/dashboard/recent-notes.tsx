import Link from "next/link";
import { displayTitle, formatUpdated } from "@/features/notes/labels";
import type { NoteListItem } from "@/features/notes/types";
import { DashboardCard } from "./dashboard-card";

export function RecentNotes({ notes }: { notes: NoteListItem[] }) {
  return (
    <DashboardCard title="Notes" action={{ href: "/notes", label: "All notes" }}>
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Personal documents stay here.</p>
      ) : (
        <ul className="divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes/${note.id}`}
                className="flex min-h-11 flex-col justify-center py-2.5"
              >
                <span className="text-sm break-words">{displayTitle(note.title)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatUpdated(note.updatedAt)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
