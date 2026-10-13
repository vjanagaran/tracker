"use client";

import { Flag } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, updateTask } from "./actions";
import { addDays, nextMonday, thisWeekend, weekdayShort } from "./dates";
import { PlanPicker } from "./plan-picker";
import { PRIORITY } from "./priority";
import { repeatLabel, tagLabel } from "./labels";
import {
  TASK_PRIORITIES,
  TASK_REPEATS,
  TASK_STATUSES,
  TASK_TAGS,
  type PlanOption,
  type TaskItem,
  type TaskPriority,
  type TaskRepeat,
  type TaskStatus,
  type TaskTag,
  type TaskTreeWheel,
} from "./types";

type TaskFormProps = {
  plans: PlanOption[];
  tree: TaskTreeWheel[];
  /** The member's calendar day, for the quick finish-by choices. */
  today: string;
  task?: TaskItem;
  onSaved: (task: TaskItem) => void;
  onCancel: () => void;
};

const NO_REPEAT = "none";

const repeatItems = [
  { value: NO_REPEAT, label: "Does not repeat" },
  ...TASK_REPEATS.map((value) => ({ value, label: repeatLabel(value) })),
];

/** Selected tag chips echo the wheel colours the rows use; the label still says which. */
const tagSelected: Record<TaskTag | "none", string> = {
  WOL: "border-status-positive/40 bg-status-positive/10 text-status-positive",
  WOB: "border-primary/40 bg-primary/10 text-primary",
  OPEN: "border-foreground/30 bg-muted text-foreground",
  none: "border-foreground/30 bg-muted text-foreground",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-5">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

const chipBase =
  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40";
const quickBase =
  "inline-flex min-h-9 items-center rounded-full border px-3 text-[13px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 pointer-coarse:min-h-11";

export function TaskForm({ plans, tree, today, task, onSaved, onCancel }: TaskFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [tag, setTag] = useState<TaskTag | null>(task?.tag ?? null);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "Not Started");
  const [planIds, setPlanIds] = useState<string[]>(task?.planIds ?? []);
  const [repeatEvery, setRepeatEvery] = useState<TaskRepeat | null>(task?.repeatEvery ?? null);
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "flexi");
  const [plannedStartOn, setPlannedStartOn] = useState(task?.plannedStartOn ?? "");
  const [plannedStartTime, setPlannedStartTime] = useState(task?.plannedStartTime ?? "");
  const [targetOn, setTargetOn] = useState(task?.targetOn ?? "");
  const [targetTime, setTargetTime] = useState(task?.targetTime ?? "");

  // A time belongs to its day: clearing the day clears the time.
  function changeStartOn(value: string) {
    setPlannedStartOn(value);
    if (!value) setPlannedStartTime("");
  }
  function changeTargetOn(value: string) {
    setTargetOn(value);
    if (!value) setTargetTime("");
  }

  const quickDates = [
    { label: "Today", value: today },
    { label: "Tomorrow", value: addDays(today, 1) },
    { label: "This weekend", value: thisWeekend(today) },
    { label: "Next week", value: nextMonday(today) },
  ];

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      tag,
      status,
      priority,
      plannedStartOn,
      plannedStartTime,
      targetOn,
      targetTime,
      repeatEvery,
      repeatUntil: String(formData.get("repeatUntil") ?? ""),
      planIds,
    };
    const result = task
      ? await updateTask({ id: task.id, ...payload })
      : await createTask(payload);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    onSaved(result.task);
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title" className="text-xs text-muted-foreground">
          What are you doing
        </Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={task?.title ?? ""}
          className="h-12 px-3 text-base font-medium md:text-base"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description" className="text-xs text-muted-foreground">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={task?.description ?? ""}
          placeholder="Detail, a link, or what done looks like"
          className="min-h-[5.5rem] px-3 py-2.5"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status" className="text-xs text-muted-foreground">
          Status
        </Label>
        <Select value={status} onValueChange={(value) => setStatus(value ?? "Not Started")}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-xs text-muted-foreground">Priority</legend>
        <div className="grid grid-cols-4 gap-2">
          {TASK_PRIORITIES.map((value) => {
            const style = PRIORITY[value];
            const selected = priority === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  selected
                    ? style.pill
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
                onClick={() => setPriority(value)}
              >
                <Flag
                  className={cn("size-4", style.text)}
                  fill={value === "flexi" ? "none" : "currentColor"}
                  aria-hidden="true"
                />
                {style.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Section title="Dates">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="plannedStartOn" className="text-sm">
            Planning to start
          </Label>
          <div className="grid grid-cols-[1fr_8.5rem] gap-2">
            <Input
              id="plannedStartOn"
              type="date"
              value={plannedStartOn}
              onChange={(event) => changeStartOn(event.target.value)}
              className="min-h-11"
            />
            <Input
              type="time"
              aria-label="Start time, optional"
              value={plannedStartTime}
              disabled={!plannedStartOn}
              onChange={(event) => setPlannedStartTime(event.target.value)}
              className="min-h-11"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetOn" className="text-sm">
            Finish by
          </Label>
          <div className="grid grid-cols-[1fr_8.5rem] gap-2">
            <Input
              id="targetOn"
              type="date"
              required={repeatEvery != null}
              value={targetOn}
              onChange={(event) => changeTargetOn(event.target.value)}
              className="min-h-11"
            />
            <Input
              type="time"
              aria-label="Finish-by time, optional"
              value={targetTime}
              disabled={!targetOn}
              onChange={(event) => setTargetTime(event.target.value)}
              className="min-h-11"
            />
          </div>
        </div>

        <div role="group" aria-label="Finish by shortcuts" className="flex flex-wrap gap-2">
          {quickDates.map((choice) => (
            <button
              key={choice.label}
              type="button"
              aria-pressed={targetOn === choice.value}
              className={cn(
                quickBase,
                targetOn === choice.value
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setTargetOn(choice.value)}
            >
              {choice.label}
              <span className="ml-1.5 text-muted-foreground/80">{weekdayShort(choice.value)}</span>
            </button>
          ))}
          {targetOn && repeatEvery == null ? (
            <button
              type="button"
              className={cn(quickBase, "border-transparent text-muted-foreground hover:text-foreground")}
              onClick={() => changeTargetOn("")}
            >
              Clear date
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="repeatEvery" className="text-sm">
              Repeat
            </Label>
            <Select
              value={repeatEvery ?? NO_REPEAT}
              items={repeatItems}
              onValueChange={(value) =>
                setRepeatEvery(value && value !== NO_REPEAT ? (value as TaskRepeat) : null)
              }
            >
              <SelectTrigger id="repeatEvery" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {repeatItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {repeatEvery ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="repeatUntil" className="text-sm">
                Until
              </Label>
              <Input
                id="repeatUntil"
                name="repeatUntil"
                type="date"
                defaultValue={task?.repeatUntil ?? ""}
                className="min-h-11"
              />
              <p className="text-xs text-muted-foreground">Leave blank to keep going.</p>
            </div>
          ) : null}
        </div>
        {repeatEvery && !targetOn ? (
          <p className="text-xs text-muted-foreground">A repeating task needs a finish-by date.</p>
        ) : null}
      </Section>

      <Section title="Tag">
        <div className="flex flex-wrap gap-2">
          {TASK_TAGS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tag === value}
              className={cn(
                chipBase,
                tag === value
                  ? tagSelected[value]
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setTag(value)}
            >
              {tagLabel(value)}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={tag === null}
            className={cn(
              chipBase,
              tag === null
                ? tagSelected.none
                : "border-border text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTag(null)}
          >
            None
          </button>
        </div>
      </Section>

      <Section title="Working toward">
        <p className="-mt-1.5 text-xs text-muted-foreground">
          Optional. You can link more than one, or none.
        </p>
        <PlanPicker catalog={plans} tree={tree} value={planIds} onChange={setPlanIds} />
      </Section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center gap-2 border-t border-border bg-background px-1 py-3">
        <Button type="submit" className="min-h-11 px-5" disabled={pending}>
          {pending ? "Saving task" : "Save task"}
        </Button>
        <Button type="button" variant="outline" className="min-h-11 px-4" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
