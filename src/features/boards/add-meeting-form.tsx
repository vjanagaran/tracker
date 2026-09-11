"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addMeeting } from "./actions";

export function AddMeetingForm({ boardId }: { boardId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await addMeeting({
      boardId,
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
      agenda: String(formData.get("agenda") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success("Meeting added.");
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
        }
      }}
    >
      <DialogTrigger render={<Button type="button" variant="outline" className="min-h-11 px-4" />}>
        <Plus className="size-4" aria-hidden="true" />
        Add a meeting
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a meeting</DialogTitle>
          <DialogDescription>Sets the counting window for this board.</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scheduledAt">When</Label>
            <Input
              id="scheduledAt"
              name="scheduledAt"
              type="datetime-local"
              required
              className="min-h-11"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agenda">Agenda</Label>
            <Textarea id="agenda" name="agenda" rows={3} placeholder="Topics to cover" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" className="min-h-11 px-4" disabled={pending}>
              <Plus className="size-4" aria-hidden="true" />
              {pending ? "Adding a meeting" : "Add a meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
