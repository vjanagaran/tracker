"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addActionPlan } from "./actions";
import type { ActionPlan } from "./types";

export function AddActionPlan({
  focusAreaId,
  onAdded,
}: {
  focusAreaId: string;
  onAdded: (plan: ActionPlan) => void;
}) {
  const [description, setDescription] = useState("");
  const [challenge, setChallenge] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!description.trim() || pending) {
      return;
    }
    setPending(true);
    setError(null);
    const result = await addActionPlan({ focusAreaId, description, challenge });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setDescription("");
    setChallenge("");
    toast.success("Action plan added.");
    onAdded(result.plan);
  }

  return (
    <div className="grid gap-2 py-2 md:grid-cols-[1fr_1fr_auto] md:items-center">
      <Input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
        className="min-h-11"
        placeholder="Add an action plan"
        aria-label="Action plan"
      />
      <Input
        value={challenge}
        onChange={(event) => setChallenge(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
        className="min-h-11"
        placeholder="What makes it hard"
        aria-label="What makes it hard"
      />
      <Button
        type="button"
        variant="outline"
        className="min-h-11 px-4"
        disabled={pending || !description.trim()}
        onClick={() => void submit()}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add
      </Button>
      {error ? <p className="text-sm text-destructive md:col-span-3">{error}</p> : null}
    </div>
  );
}
