"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { addSpoke, deleteSpoke, disableSpoke, enableSpoke, renameSpoke, reorderSpokes } from "./actions";
import type { WheelSpoke } from "./types";

type SpokeManagerProps = {
  wheelId: string;
  spokes: WheelSpoke[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SpokeManager({ wheelId, spokes, open, onOpenChange }: SpokeManagerProps) {
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

  function saveName(spoke: WheelSpoke) {
    const nextName = (drafts[spoke.id] ?? spoke.name).trim();
    if (nextName && nextName !== spoke.name) {
      rename.mutate({ spokeId: spoke.id, name: nextName });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[min(40rem,calc(100dvh-2rem))] sm:max-w-lg"
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle>Spokes</DialogTitle>
            <DialogDescription>
              Name the functions you run. Disable a spoke to keep old cycles readable.
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex gap-2"
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
            <Button
              type="submit"
              className="min-h-11 shrink-0 px-3"
              disabled={add.isPending || !name.trim()}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add
            </Button>
          </form>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {active.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No spokes yet. Add the first function above.
            </p>
          ) : (
            <ul className="max-h-[min(20rem,50dvh)] overflow-y-auto">
              {active.map((spoke, index) => (
                <li
                  key={spoke.id}
                  className="flex items-center gap-1 border-b border-border py-1.5 last:border-b-0"
                >
                  <Input
                    className="min-h-11 border-transparent bg-transparent px-2 shadow-none"
                    aria-label={`Name for ${spoke.name}`}
                    value={drafts[spoke.id] ?? spoke.name}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [spoke.id]: event.target.value,
                      }))
                    }
                    onBlur={() => saveName(spoke)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        (event.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0"
                    disabled={index === 0}
                    aria-label={`Move ${spoke.name} up`}
                    onClick={() => shift(index, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-11 shrink-0"
                    disabled={index === active.length - 1}
                    aria-label={`Move ${spoke.name} down`}
                    onClick={() => shift(index, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 shrink-0 px-2 text-muted-foreground"
                    onClick={() => disable.mutate(spoke.id)}
                  >
                    Disable
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 shrink-0 px-2 text-muted-foreground"
                    onClick={() => setRemoveTarget(spoke)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {disabled.length > 0 ? (
            <Collapsible>
              <CollapsibleTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11 gap-1.5 px-2 text-muted-foreground group"
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
                <ul>
                  {disabled.map((spoke) => (
                    <li
                      key={spoke.id}
                      className="flex min-h-11 items-center justify-between gap-2 border-b border-border last:border-b-0"
                    >
                      <span className="text-sm">{spoke.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
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
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={removeTarget != null}
        onOpenChange={(openDialog) => {
          if (!openDialog) {
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
    </>
  );
}
