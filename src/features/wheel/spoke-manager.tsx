"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { addSpoke, deleteSpoke, disableSpoke, enableSpoke, renameSpoke, reorderSpokes } from "./actions";
import type { WheelSpoke } from "./types";

type SpokeManagerProps = {
  wheelId: string;
  spokes: WheelSpoke[];
};

export function SpokeManager({ wheelId, spokes }: SpokeManagerProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [removeTarget, setRemoveTarget] = useState<WheelSpoke | null>(null);

  const active = spokes.filter((spoke) => spoke.isActive);
  const disabled = spokes.filter((spoke) => !spoke.isActive);

  const add = useMutation({
    mutationFn: async () => addSpoke({ wheelId, name }),
    onSuccess: (result) => {
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setName("");
      setError(null);
      toast.success("Spoke added.");
      router.refresh();
    },
  });

  const rename = useMutation({
    mutationFn: async (input: { spokeId: string; name: string }) => renameSpoke(input),
    onSuccess: (result) => {
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    },
  });

  const move = useMutation({
    mutationFn: async (orderedIds: string[]) => reorderSpokes({ wheelId, orderedIds }),
    onSuccess: (result) => {
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      router.refresh();
    },
  });

  const disable = useMutation({
    mutationFn: async (spokeId: string) => disableSpoke({ spokeId }),
    onSuccess: (result) => {
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      toast.success("Spoke disabled.");
      router.refresh();
    },
  });

  const enable = useMutation({
    mutationFn: async (spokeId: string) => enableSpoke({ spokeId }),
    onSuccess: (result) => {
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      toast.success("Spoke enabled.");
      router.refresh();
    },
  });

  const remove = useMutation({
    mutationFn: async (spokeId: string) => deleteSpoke({ spokeId }),
    onSuccess: (result) => {
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setError(null);
      toast.success("Spoke removed.");
      router.refresh();
    },
  });

  function shift(index: number, direction: -1 | 1) {
    const next = [...active];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) {
      return;
    }
    const current = next[index];
    const other = next[swap];
    if (!current || !other) {
      return;
    }
    next[index] = other;
    next[swap] = current;
    move.mutate(next.map((spoke) => spoke.id));
  }

  return (
    <section className="mt-8 max-w-xl">
      <h2 className="mb-3 text-sm font-medium">Spokes</h2>
      <form
        className="mb-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          add.mutate();
        }}
      >
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name a function you run"
          className="min-h-11"
          aria-label="New spoke name"
        />
        <Button type="submit" className="min-h-11 px-4" disabled={add.isPending || !name.trim()}>
          <Plus className="size-4" aria-hidden="true" />
          Add a spoke
        </Button>
      </form>
      {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {active.map((spoke, index) => (
          <li key={spoke.id} className="pb-card flex flex-col gap-2 p-2 sm:flex-row sm:items-center">
            <Input
              className="min-h-11"
              aria-label={`Name for ${spoke.name}`}
              value={drafts[spoke.id] ?? spoke.name}
              onChange={(event) =>
                setDrafts((current) => ({ ...current, [spoke.id]: event.target.value }))
              }
              onBlur={() => {
                const nextName = (drafts[spoke.id] ?? spoke.name).trim();
                if (nextName && nextName !== spoke.name) {
                  rename.mutate({ spokeId: spoke.id, name: nextName });
                }
              }}
            />
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-3"
                disabled={index === 0}
                onClick={() => shift(index, -1)}
              >
                Up
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-3"
                disabled={index === active.length - 1}
                onClick={() => shift(index, 1)}
              >
                Down
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-3"
                onClick={() => disable.mutate(spoke.id)}
              >
                Disable
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 px-3"
                onClick={() => setRemoveTarget(spoke)}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {disabled.length > 0 ? (
        <Collapsible className="mt-4">
          <CollapsibleTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 gap-1.5 px-3 text-muted-foreground group"
              />
            }
          >
            Disabled spokes
            <ChevronDown
              className="size-4 transition-transform group-data-panel-open:rotate-180"
              aria-hidden="true"
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 data-ending-style:h-0 data-starting-style:h-0">
            <ul className="mt-2 flex flex-col gap-2">
              {disabled.map((spoke) => (
                <li key={spoke.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{spoke.name}</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 px-3"
                    onClick={() => enable.mutate(spoke.id)}
                  >
                    Enable
                  </Button>
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <AlertDialog
        open={removeTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              This only works if the spoke has no focus areas or past ratings. If it has history,
              disable it instead so past cycles keep their record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => {
                if (removeTarget) {
                  remove.mutate(removeTarget.id);
                  setRemoveTarget(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
