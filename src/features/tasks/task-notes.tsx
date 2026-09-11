"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { addTaskNote } from "./actions";
import { formatNoteTime } from "./labels";
import type { TaskNote } from "./types";

export function TaskNotes({
  taskId,
  notes,
  onAdded,
}: {
  taskId: string;
  notes: TaskNote[];
  onAdded: (note: TaskNote) => void;
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
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-sm font-medium">Notes</h2>
      {notes.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Notes stay with the task, so a slipped item keeps its story.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="pb-card px-3 py-3">
              <p className="text-sm break-words whitespace-pre-wrap">{note.note}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatNoteTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form ref={formRef} action={onSubmit} className="mt-4 flex flex-col gap-2">
        <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          Add a note
          <textarea
            name="note"
            required
            rows={3}
            className="min-h-[5.5rem] w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm text-foreground"
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="min-h-11 w-fit px-4" disabled={pending}>
          {pending ? "Adding a note" : "Add a note"}
        </Button>
      </form>
    </section>
  );
}
