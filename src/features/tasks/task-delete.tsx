"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteTask } from "./actions";
import type { TaskItem } from "./types";

function consequence(task: TaskItem) {
  const parts = [`“${task.title}” will be removed for good`];
  if (task.notes.length > 0) {
    parts.push(`along with its ${task.notes.length} ${task.notes.length === 1 ? "note" : "notes"}`);
  }
  let text = `${parts.join(" ")}.`;
  if (task.repeatEvery && task.status !== "Completed" && task.status !== "Cancelled") {
    text += " It repeats, and deleting it ends the repeat. To keep the repeat going, complete it instead.";
  }
  if (task.status === "Completed") {
    text += " Deleting it also removes it from your completed list.";
  }
  return text;
}

export function TaskDelete({ task, onDeleted }: { task: TaskItem; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    const result = await deleteTask({ id: task.id });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    onDeleted();
  }

  return (
    <section className="mt-8 border-t border-border pt-6" aria-label="Delete task">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 border-destructive/40 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete task
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Removes this task and its notes. Use Cancelled instead to keep it on record.
      </p>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task</AlertDialogTitle>
            <AlertDialogDescription>{consequence(task)}</AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep task</AlertDialogCancel>
            {/* The dialog stays open until the server answers, so an error can be read. */}
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => void remove()}
            >
              {pending ? "Deleting task" : "Delete task"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
