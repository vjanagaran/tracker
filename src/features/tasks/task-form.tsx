"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTask, updateTask } from "./actions";
import { PlanPicker } from "./plan-picker";
import { tagLabel } from "./labels";
import {
  TASK_STATUSES,
  TASK_TAGS,
  type PlanOption,
  type TaskItem,
  type TaskStatus,
  type TaskTag,
} from "./types";

type TaskFormProps = {
  plans: PlanOption[];
  task?: TaskItem;
  onSaved: (task: TaskItem) => void;
  onCancel: () => void;
};

export function TaskForm({ plans, task, onSaved, onCancel }: TaskFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [tag, setTag] = useState<TaskTag | null>(task?.tag ?? null);
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "Not Started");
  const [planIds, setPlanIds] = useState<string[]>(task?.planIds ?? []);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const payload = {
      title: String(formData.get("title") ?? ""),
      tag,
      status,
      plannedStartOn: String(formData.get("plannedStartOn") ?? ""),
      targetOn: String(formData.get("targetOn") ?? ""),
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
    <form action={onSubmit} className="flex max-w-xl flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">What are you doing</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={task?.title ?? ""}
          className="min-h-11"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="plannedStartOn">Planning to start</Label>
          <Input
            id="plannedStartOn"
            name="plannedStartOn"
            type="date"
            defaultValue={task?.plannedStartOn ?? ""}
            className="min-h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="targetOn">Finish by</Label>
          <Input
            id="targetOn"
            name="targetOn"
            type="date"
            defaultValue={task?.targetOn ?? ""}
            className="min-h-11"
          />
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Tag</legend>
        <div className="flex flex-wrap gap-2">
          {TASK_TAGS.map((value) => (
            <button
              key={value}
              type="button"
              className={`min-h-11 rounded-full border px-3 text-sm ${
                tag === value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background"
              }`}
              onClick={() => setTag(value)}
            >
              {tagLabel(value)}
            </button>
          ))}
          <button
            type="button"
            className={`min-h-11 rounded-full border px-3 text-sm ${
              tag === null
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background"
            }`}
            onClick={() => setTag(null)}
          >
            None
          </button>
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium">Working toward</p>
        <p className="text-xs text-muted-foreground">
          Optional. You can link more than one, or none.
        </p>
        <PlanPicker catalog={plans} value={planIds} onChange={setPlanIds} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">Status</Label>
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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="min-h-11 px-4" disabled={pending}>
          {pending ? "Saving task" : "Save task"}
        </Button>
        <Button type="button" variant="outline" className="min-h-11 px-4" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
