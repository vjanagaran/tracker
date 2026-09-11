"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { moveMeeting } from "./actions";
import { toDateTimeLocal } from "./labels";

type MoveMeetingFormProps = {
  boardId: string;
  meetingId: string;
  scheduledAt: string;
};

export function MoveMeetingForm({
  boardId,
  meetingId,
  scheduledAt,
}: MoveMeetingFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await moveMeeting({
      boardId,
      meetingId,
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success("Meeting moved.");
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="ghost" className="min-h-11 px-3 text-primary" />}
      >
        Move
      </PopoverTrigger>
      <PopoverContent>
        <form action={onSubmit} className="flex flex-col gap-2">
          <Label htmlFor={`move-${meetingId}`} className="sr-only">
            New time
          </Label>
          <Input
            id={`move-${meetingId}`}
            name="scheduledAt"
            type="datetime-local"
            required
            defaultValue={toDateTimeLocal(scheduledAt)}
            className="min-h-11"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="min-h-11 px-4" disabled={pending}>
            {pending ? "Moving this one" : "Move this one"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
