"use client";

import {
  CalendarDays,
  CalendarRange,
  Columns3,
  List,
  ListFilter,
  Presentation,
  X,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
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
import { buildScopeIndex, filterTasks, nodePath, whenLabel, type TaskScope } from "./scope";
import { TaskBoard } from "./task-board";
import { TaskCalendar } from "./task-calendar";
import { TaskDelete } from "./task-delete";
import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";
import { TaskNotes } from "./task-notes";
import type { RowContext } from "./task-row";
import { TaskScopePanel } from "./task-scope-panel";
import { TaskWeek } from "./task-week";
import { useMediaQuery } from "./use-media-query";
import { useTasks } from "./use-tasks";
import { useToday } from "./use-today";
import { useViewState } from "./use-view-state";
import type { TaskLayout } from "./url";
import type { PlanOption, TaskItem, TaskTreeWheel } from "./types";

type Mode =
  | { view: "list" }
  | { view: "create" }
  | { view: "edit"; id: string }
  | { view: "notes"; id: string };

const LAYOUTS: { id: TaskLayout; label: string; icon: LucideIcon }[] = [
  { id: "list", label: "List", icon: List },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "week", label: "Week", icon: CalendarRange },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
];

function scopeTitle(scope: TaskScope) {
  if (scope.view === "completed") return "Completed";
  if (scope.view === "cancelled") return "Cancelled";
  return scope.when === "all" ? "All tasks" : whenLabel(scope.when);
}

function scopeNote(scope: TaskScope, layout: TaskLayout) {
  if (scope.view === "completed") return "Most recently completed first.";
  if (scope.view === "cancelled") return "Cancelled items stay on record.";
  if (layout === "board") return "Drag a card to another column to change its status.";
  if (layout === "week" || layout === "calendar") {
    return "Drag a task onto a day to change its finish-by date.";
  }
  return "Earliest commitment first. This is the list you share when it is your turn.";
}

export function TaskWorkspace({
  initialTasks,
  plans,
  tree,
  serverToday,
  timeZone,
}: {
  initialTasks: TaskItem[];
  plans: PlanOption[];
  tree: TaskTreeWheel[];
  serverToday: string;
  timeZone: string | null;
}) {
  const { tasks, updateStatus, updateTarget, upsertTask, removeTask, appendNote, statusError } =
    useTasks(initialTasks);
  const [mode, setMode] = useState<Mode>({ view: "list" });
  const [view, setView] = useViewState(tree);
  const { scope, layout, present } = view;
  // On a phone the list comes first; this opens the views and tree as a screen.
  const [panelOpen, setPanelOpen] = useState(false);
  const today = useToday(serverToday, timeZone);
  // Wide screens keep the task beside the list; narrower ones slide it over.
  const wide = useMediaQuery("(min-width: 1280px)");

  const index = buildScopeIndex(tree, plans);
  const visible = filterTasks(tasks, scope, today, index);
  const trail = scope.node ? nodePath(scope.node, tree) : [];
  const planById = new Map(plans.map((plan) => [plan.id, plan]));

  const editing = mode.view === "edit" ? tasks.find((task) => task.id === mode.id) : null;
  const noting = mode.view === "notes" ? tasks.find((task) => task.id === mode.id) : null;
  const editorOpen = mode.view === "create" || (mode.view === "edit" && Boolean(editing));
  const inPane = wide && !present;

  function close() {
    setMode({ view: "list" });
  }

  function chooseScope(next: TaskScope) {
    setView({ ...view, scope: next });
    setPanelOpen(false);
  }

  function toggleDone(task: TaskItem) {
    if (task.status === "Completed") {
      updateStatus(task.id, "Not Started");
      return;
    }
    const previous = task.status;
    updateStatus(task.id, "Completed");
    // Undoing a repeating task would leave two open occurrences, so it has no Undo.
    toast.success("Task completed.", {
      action: task.repeatEvery
        ? undefined
        : { label: "Undo", onClick: () => updateStatus(task.id, previous) },
    });
  }

  function saved(task: TaskItem) {
    upsertTask(task);
    toast.success("Task saved.");
    close();
  }

  const context: RowContext = {
    planById,
    today,
    large: present,
    selectedId: mode.view === "edit" ? mode.id : null,
    onEdit: (id) => setMode({ view: "edit", id }),
    onNotes: (id) => setMode({ view: "notes", id }),
    onStatus: updateStatus,
    onToggleDone: toggleDone,
  };

  const emptyText =
    scope.view === "completed"
      ? "Nothing completed here yet."
      : scope.view === "cancelled"
        ? "Nothing cancelled here."
        : scope.when === "all" && !scope.node
          ? "No open tasks. Add one when you have something to finish this fortnight."
          : "No open tasks match this view.";

  const editor =
    mode.view === "create" ? (
      <TaskForm plans={plans} tree={tree} today={today} onSaved={saved} onCancel={close} />
    ) : editing ? (
      <>
        <TaskForm
          key={`${editing.id}:${editing.status}:${editing.targetOn ?? ""}`}
          task={editing}
          plans={plans}
          tree={tree}
          today={today}
          onSaved={saved}
          onCancel={close}
        />
        <TaskNotes
          taskId={editing.id}
          notes={editing.notes}
          onAdded={(note) => appendNote(editing.id, note)}
        />
        <TaskDelete
          task={editing}
          onDeleted={() => {
            removeTask(editing.id);
            toast.success("Task deleted.");
            close();
          }}
        />
      </>
    ) : null;

  const editorTitle = mode.view === "edit" ? "Edit task" : "New task";

  return (
    <div className="-mx-5 -mt-6 flex min-h-[calc(100dvh-8.5rem)] flex-col md:-mx-10 md:-my-9 md:min-h-dvh md:flex-row">
      <aside
        className={cn(
          "w-full shrink-0 flex-col border-border px-5 md:w-72 md:border-r md:px-4 md:py-6",
          "md:sticky md:top-0 md:h-dvh md:self-start",
          present ? "hidden" : cn(panelOpen ? "flex" : "hidden", "md:flex"),
        )}
      >
        <TaskScopePanel
          tasks={tasks}
          tree={tree}
          index={index}
          today={today}
          scope={scope}
          onScope={chooseScope}
          onAdd={() => setMode({ view: "create" })}
          onBack={() => setPanelOpen(false)}
        />
      </aside>

      <section
        className={cn(
          "min-w-0 flex-1 px-5 py-4 md:block md:px-8 md:py-6",
          panelOpen && !present ? "hidden" : "block",
        )}
      >
        <div>
          {present ? null : (
            <Button
              type="button"
              variant="ghost"
              className="-ml-2 mb-1 min-h-11 px-2 text-muted-foreground md:hidden"
              onClick={() => setPanelOpen(true)}
            >
              <ListFilter className="size-4" aria-hidden="true" />
              Views and focus areas
            </Button>
          )}

          <header className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1 basis-64">
              {trail.length > 0 ? (
                <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                  <span className="break-words">{trail.join(" / ")}</span>
                  <button
                    type="button"
                    className="min-h-11 underline-offset-4 hover:text-foreground hover:underline md:min-h-6"
                    onClick={() => setView({ ...view, scope: { ...scope, node: null } })}
                  >
                    Clear focus
                  </button>
                </p>
              ) : null}
              <h2
                className={cn(
                  "font-semibold tracking-tight",
                  present ? "text-4xl" : "text-[1.75rem] md:text-[2rem]",
                )}
              >
                {scopeTitle(scope)}
              </h2>
              <p
                className={cn(
                  "mt-1.5 max-w-prose text-muted-foreground",
                  present ? "text-base" : "text-sm",
                )}
              >
                {visible.length} {scope.view === "open" ? "open" : scope.view}
                {" · "}
                {scopeNote(scope, layout)}
              </p>
            </div>

            <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
              {scope.view === "open" ? (
                <div
                  role="group"
                  aria-label="Layout"
                  className="inline-flex rounded-lg border border-border p-0.5"
                >
                  {LAYOUTS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={layout === id}
                      className={cn(
                        "inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm transition-colors",
                        layout === id
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                      // The week and calendar are date views themselves, so they drop any date row chosen.
                      onClick={() =>
                        setView({
                          ...view,
                          layout: id,
                          scope: id === "week" || id === "calendar" ? { ...scope, when: "all" } : scope,
                        })
                      }
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-3"
                onClick={() => setView({ ...view, present: !present })}
              >
                {present ? (
                  <X className="size-4" aria-hidden="true" />
                ) : (
                  <Presentation className="size-4" aria-hidden="true" />
                )}
                {present ? "Exit meeting mode" : "Meeting mode"}
              </Button>
            </div>
          </header>

          {/* The list reads best at a measure; the other layouts use the width. */}
          <div className={layout === "list" ? (present ? "max-w-5xl" : "max-w-4xl") : undefined}>
            {layout === "board" && scope.view === "open" ? (
              <TaskBoard tasks={visible} context={context} emptyText={emptyText} />
            ) : layout === "week" && scope.view === "open" ? (
              <TaskWeek
                tasks={visible}
                context={context}
                emptyText={emptyText}
                onMove={updateTarget}
              />
            ) : layout === "calendar" && scope.view === "open" ? (
              <TaskCalendar
                tasks={visible}
                context={context}
                emptyText={emptyText}
                onMove={updateTarget}
              />
            ) : (
              <TaskList
                tasks={visible}
                view={scope.view}
                grouped={scope.view === "open" && scope.when === "all"}
                context={context}
                emptyText={emptyText}
                onAdd={() => setMode({ view: "create" })}
              />
            )}

            {statusError ? <p className="mt-4 text-sm text-destructive">{statusError}</p> : null}
          </div>
        </div>
      </section>

      {editorOpen && inPane ? (
        <aside
          aria-label={editorTitle}
          className="sticky top-0 h-dvh w-[26rem] shrink-0 self-start overflow-y-auto border-l border-border px-5 py-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{editorTitle}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              aria-label="Close"
              onClick={close}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {editor}
        </aside>
      ) : null}

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
        open={editorOpen && !inPane}
        onOpenChange={(open) => {
          if (!open) {
            close();
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editorTitle}</SheetTitle>
            {mode.view === "create" ? (
              <SheetDescription>
                Title and a target date are enough. Everything else is there when it earns its
                place.
              </SheetDescription>
            ) : null}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">{editor}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
