"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addTaskNote } from "./actions";
import { formatNoteTime } from "./labels";
import type { TaskNote } from "./types";

export function TaskNotes({
  taskId,
  notes,
  onAdded,
  showHeading = true,
}: {
  taskId: string;
  notes: TaskNote[];
  onAdded: (note: TaskNote) => void;
  showHeading?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await addTaskNote({
      taskId,
      note: String(formData.get("note") ?? ""),
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    onAdded(result.note);
  }

  return (
    <section className={showHeading ? "mt-8 border-t border-border pt-6" : undefined}>
      {showHeading ? (
        <h3 className="flex items-baseline gap-2 text-xs font-medium text-muted-foreground">
          Notes
          {notes.length > 0 ? <span className="font-normal">{notes.length}</span> : null}
        </h3>
      ) : null}
      {notes.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Notes stay with the task, so a slipped item keeps its story.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg bg-muted/60 px-3 py-2.5">
              <p className="text-sm break-words whitespace-pre-wrap">{note.note}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {formatNoteTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} action={onSubmit} className="mt-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Add a note
          <Textarea name="note" required rows={3} className="min-h-[5.5rem] text-foreground" />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="outline" className="min-h-11 w-fit px-4" disabled={pending}>
          {pending ? "Adding a note" : "Add a note"}
        </Button>
      </form>
    </section>
  );
}
