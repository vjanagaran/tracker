"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addFocusArea } from "./actions";

export function AddFocusArea({ spokeId }: { spokeId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      firstFieldRef.current?.focus();
    }
  }, [open]);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await addFocusArea({
      spokeId,
      currentIssue: String(formData.get("currentIssue") ?? ""),
      goal1y: String(formData.get("goal1y") ?? ""),
      goal5y: String(formData.get("goal5y") ?? ""),
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success("Focus area added.");
    router.refresh();
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      {!open ? (
        <CollapsibleTrigger render={<Button type="button" variant="outline" className="min-h-11 px-4" />}>
          <Plus className="size-4" aria-hidden="true" />
          Add a focus area
        </CollapsibleTrigger>
      ) : null}
      <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-150 data-ending-style:h-0 data-starting-style:h-0">
        <form action={onSubmit} className="pb-card max-w-xl p-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentIssue">Focus area</Label>
              <Input
                id="currentIssue"
                name="currentIssue"
                required
                ref={firstFieldRef}
                className="min-h-11"
                placeholder="The issue as it stands today"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal1y">In a year</Label>
              <Input id="goal1y" name="goal1y" className="min-h-11" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="goal5y">In five</Label>
              <Input id="goal5y" name="goal5y" className="min-h-11" />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="min-h-11 px-4" disabled={pending}>
                <Plus className="size-4" aria-hidden="true" />
                {pending ? "Adding a focus area" : "Add a focus area"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 px-4"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </form>
      </CollapsibleContent>
    </Collapsible>
  );
}
