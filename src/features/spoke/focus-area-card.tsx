"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Dot, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddActionPlan } from "./add-action-plan";
import { removeActionPlan, removeFocusArea, updateActionPlan, updateFocusArea } from "./actions";
import { PLAN_STATUSES, type ActionPlan, type FocusArea, type PlanStatus } from "./types";

const planStatusTone: Record<PlanStatus, BadgeTone> = {
  Active: "accent",
  Completed: "positive",
  Dropped: "neutral",
};

export function FocusAreaCard({ area }: { area: FocusArea }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState(area.plans);
  const [removingArea, setRemovingArea] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const issueRef = useRef(area.currentIssue);
  const goal1yRef = useRef(area.goal1y ?? "");
  const goal5yRef = useRef(area.goal5y ?? "");
  const savedRef = useRef({
    currentIssue: area.currentIssue,
    goal1y: area.goal1y ?? "",
    goal5y: area.goal5y ?? "",
  });

  async function saveFocus() {
    const currentIssue = issueRef.current.trim();
    if (!currentIssue) {
      return;
    }
    const goal1y = goal1yRef.current.trim();
    const goal5y = goal5yRef.current.trim();
    if (
      currentIssue === savedRef.current.currentIssue &&
      goal1y === savedRef.current.goal1y &&
      goal5y === savedRef.current.goal5y
    ) {
      return;
    }
    const result = await updateFocusArea({
      focusAreaId: area.id,
      currentIssue,
      goal1y,
      goal5y,
    });
    if ("error" in result) {
      setError(result.error);
      return;
    }
    savedRef.current = { currentIssue, goal1y, goal5y };
    setError(null);
  }

  async function removeArea() {
    setRemovingArea(true);
    const result = await removeFocusArea({ id: area.id });
    setRemovingArea(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError(null);
    toast.success("Focus area removed.");
    router.refresh();
  }

  return (
    <article className="pb-card">
      <header className="flex items-start justify-between gap-3 rounded-t-lg border-b border-border bg-muted px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] tracking-wide text-muted-foreground uppercase">
            Focus area
          </p>
          <Input
            defaultValue={area.currentIssue}
            required
            className="h-11 min-h-11 border-transparent bg-transparent px-0 text-sm font-semibold shadow-none md:text-sm"
            aria-label="Focus area"
            onChange={(event) => {
              issueRef.current = event.target.value;
            }}
            onBlur={() => {
              void saveFocus();
            }}
          />
          <div className="mt-1 flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:flex-wrap md:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0">In a year —</span>
              <Input
                defaultValue={area.goal1y ?? ""}
                className="h-11 min-h-11 border-transparent bg-transparent px-0 shadow-none"
                aria-label="In a year"
                onChange={(event) => {
                  goal1yRef.current = event.target.value;
                }}
                onBlur={() => {
                  void saveFocus();
                }}
              />
            </label>
            <span className="hidden md:inline">·</span>
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <span className="shrink-0">In five —</span>
              <Input
                defaultValue={area.goal5y ?? ""}
                className="h-11 min-h-11 border-transparent bg-transparent px-0 shadow-none"
                aria-label="In five"
                onChange={(event) => {
                  goal5yRef.current = event.target.value;
                }}
                onBlur={() => {
                  void saveFocus();
                }}
              />
            </label>
          </div>
        </div>
        {plans.length === 0 ? (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 shrink-0 px-3"
            disabled={removingArea}
            onClick={() => setConfirmRemove(true)}
          >
            {removingArea ? "Removing" : "Remove"}
          </Button>
        ) : null}
      </header>

      <div className="px-3.5 py-1">
        <table className="hidden w-full border-collapse md:table">
          <thead>
            <tr className="border-b border-border text-left text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              <th className="w-[52%] py-2 pr-3">Action plan</th>
              <th className="py-2 pr-3">What makes it hard</th>
              <th className="w-[132px] py-2">Status</th>
              <th className="w-[88px] py-2" />
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <PlanRow
                key={plan.id}
                plan={plan}
                layout="table"
                onError={setError}
                onSaved={(next) => {
                  setPlans((current) =>
                    current.map((row) => (row.id === next.id ? next : row)),
                  );
                }}
                onRemoved={(planId) => {
                  setPlans((current) => current.filter((row) => row.id !== planId));
                }}
              />
            ))}
          </tbody>
        </table>

        <ul className="flex flex-col gap-4 py-3 md:hidden">
          {plans.map((plan) => (
            <li key={plan.id} className="pb-card p-3">
              <PlanRow
                plan={plan}
                layout="stack"
                onError={setError}
                onSaved={(next) => {
                  setPlans((current) =>
                    current.map((row) => (row.id === next.id ? next : row)),
                  );
                }}
                onRemoved={(planId) => {
                  setPlans((current) => current.filter((row) => row.id !== planId));
                }}
              />
            </li>
          ))}
        </ul>

        <div className="py-2">
          <AddActionPlan
            focusAreaId={area.id}
            onAdded={(plan) => {
              setPlans((current) => [...current, plan]);
            }}
          />
        </div>
        {error ? <p className="pb-3 text-sm text-destructive">{error}</p> : null}
      </div>

      <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this focus area</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{area.currentIssue}&rdquo; has no action plans, so this removes it for good.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removingArea}
              onClick={() => {
                setConfirmRemove(false);
                void removeArea();
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

function PlanRow({
  plan,
  layout,
  onError,
  onSaved,
  onRemoved,
}: {
  plan: ActionPlan;
  layout: "table" | "stack";
  onError: (message: string | null) => void;
  onSaved: (plan: ActionPlan) => void;
  onRemoved: (planId: string) => void;
}) {
  const descriptionRef = useRef(plan.description);
  const challengeRef = useRef(plan.challenge ?? "");
  const statusRef = useRef(plan.status);
  const [statusValue, setStatusValue] = useState(plan.status);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  async function remove() {
    setRemoving(true);
    const result = await removeActionPlan({ id: plan.id });
    setRemoving(false);
    if ("error" in result) {
      onError(result.error);
      return;
    }
    onError(null);
    toast.success("Action plan removed.");
    onRemoved(plan.id);
  }

  async function save(next?: { status?: PlanStatus }) {
    const description = descriptionRef.current.trim();
    if (!description) {
      return;
    }
    if (next?.status) {
      statusRef.current = next.status;
    }
    const challenge = challengeRef.current.trim() ? challengeRef.current.trim() : null;
    const result = await updateActionPlan({
      planId: plan.id,
      description,
      challenge: challenge ?? "",
      status: statusRef.current,
    });
    if ("error" in result) {
      onError(result.error);
      return;
    }
    onError(null);
    onSaved({
      id: plan.id,
      description,
      challenge,
      status: statusRef.current,
      sortOrder: plan.sortOrder,
    });
  }

  const descriptionField = (
    <Input
      defaultValue={plan.description}
      className="min-h-11"
      aria-label="Action plan"
      onChange={(event) => {
        descriptionRef.current = event.target.value;
      }}
      onBlur={() => {
        if (descriptionRef.current.trim() !== plan.description) {
          void save();
        }
      }}
    />
  );
  const challengeField = (
    <Input
      defaultValue={plan.challenge ?? ""}
      className="min-h-11"
      placeholder="—"
      aria-label="What makes it hard"
      onChange={(event) => {
        challengeRef.current = event.target.value;
      }}
      onBlur={() => {
        if ((challengeRef.current.trim() || "") !== (plan.challenge ?? "")) {
          void save();
        }
      }}
    />
  );
  const statusField = (
    <div className="flex items-center gap-2">
      <Dot tone={planStatusTone[plan.status]} />
      <Select
        value={statusValue}
        onValueChange={(value) => {
          if (value) {
            setStatusValue(value);
            void save({ status: value });
          }
        }}
      >
        <SelectTrigger className="w-full" aria-label="Status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PLAN_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const confirmDialog = (
    <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this action plan</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{plan.description}&rdquo; will be removed. Tasks working toward it keep their
            own record, just without this link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={removing}
            onClick={() => {
              setConfirmRemove(false);
              void remove();
            }}
          >
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (layout === "stack") {
    return (
      <>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Action plan
          {descriptionField}
        </label>
        <label className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
          What makes it hard
          {challengeField}
        </label>
        <label className="mt-3 flex flex-col gap-1 text-xs text-muted-foreground">
          Status
          {statusField}
        </label>
        <Button
          type="button"
          variant="ghost"
          className="mt-3 min-h-11 px-3"
          disabled={removing}
          onClick={() => setConfirmRemove(true)}
        >
          {removing ? "Removing" : "Remove"}
        </Button>
        {confirmDialog}
      </>
    );
  }

  return (
    <tr className="border-b border-border/70 align-top">
      <td className="py-2 pr-3">{descriptionField}</td>
      <td className="py-2 pr-3">{challengeField}</td>
      <td className="py-2">{statusField}</td>
      <td className="py-2 text-right">
        <Button
          type="button"
          variant="ghost"
          className="min-h-11 px-3"
          disabled={removing}
          onClick={() => setConfirmRemove(true)}
        >
          {removing ? "Removing" : "Remove"}
        </Button>
        {confirmDialog}
      </td>
    </tr>
  );
}
