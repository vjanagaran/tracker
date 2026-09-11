"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";
import { TaskNotes } from "./task-notes";
import { useTasks } from "./use-tasks";
import type { PlanOption, TaskItem } from "./types";

type Mode =
  | { view: "list" }
  | { view: "create" }
  | { view: "edit"; id: string }
  | { view: "notes"; id: string };

export function TaskWorkspace({
  initialTasks,
  plans,
}: {
  initialTasks: TaskItem[];
  plans: PlanOption[];
}) {
  const { tasks, updateStatus, upsertTask, appendNote, statusError } = useTasks(initialTasks);
  const [mode, setMode] = useState<Mode>({ view: "list" });
  const [closedOpen, setClosedOpen] = useState(false);

  const editing = mode.view === "edit" ? tasks.find((task) => task.id === mode.id) : null;
  const noting = mode.view === "notes" ? tasks.find((task) => task.id === mode.id) : null;

  function close() {
    setMode({ view: "list" });
  }

  return (
    <div className="max-w-4xl">
      <header className="mb-2">
        <h1 className="text-[1.75rem] font-semibold tracking-tight md:text-[2rem]">
          Tasks
        </h1>
        <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
          Open items, earliest commitment first. This is the list you share when it is your turn.
        </p>
      </header>

      <TaskList
        tasks={tasks}
        plans={plans}
        closedOpen={closedOpen}
        statusError={statusError}
        onAdd={() => setMode({ view: "create" })}
        onEdit={(id) => setMode({ view: "edit", id })}
        onNotes={(id) => setMode({ view: "notes", id })}
        onStatus={updateStatus}
        onToggleClosed={() => setClosedOpen((open) => !open)}
      />

      <Dialog
        open={mode.view === "notes"}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
      >
        <DialogContent className="max-h-[min(40rem,calc(100dvh-2rem))] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notes</DialogTitle>
            <DialogDescription>{noting?.title ?? "Task notes"}</DialogDescription>
          </DialogHeader>
          {noting ? (
            <TaskNotes
              taskId={noting.id}
              notes={noting.notes}
              showHeading={false}
              onAdded={(note) => appendNote(noting.id, note)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Sheet
        open={mode.view === "create" || mode.view === "edit"}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{mode.view === "edit" ? "Edit task" : "New task"}</SheetTitle>
            {mode.view === "create" ? (
              <SheetDescription>
                Title and a target date are enough. Everything else is there when it earns its
                place.
              </SheetDescription>
            ) : null}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {mode.view === "create" ? (
              <TaskForm
                plans={plans}
                onSaved={(task) => {
                  upsertTask(task);
                  toast.success("Task saved.");
                  close();
                }}
                onCancel={close}
              />
            ) : null}
            {mode.view === "edit" && editing ? (
              <>
                <TaskForm
                  key={editing.id}
                  task={editing}
                  plans={plans}
                  onSaved={(task) => {
                    upsertTask(task);
                    toast.success("Task saved.");
                    close();
                  }}
                  onCancel={close}
                />
                <TaskNotes
                  taskId={editing.id}
                  notes={editing.notes}
                  onAdded={(note) => appendNote(editing.id, note)}
                />
              </>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
