"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { updateAgenda } from "./actions";

type EditAgendaFormProps = {
  boardId: string;
  meetingId: string;
  agenda: string | null;
};

export function EditAgendaForm({ boardId, meetingId, agenda }: EditAgendaFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateAgenda({
      boardId,
      meetingId,
      agenda: String(formData.get("agenda") ?? ""),
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success("Agenda saved.");
    router.refresh();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="ghost" className="min-h-11 px-3 text-primary" />}
      >
        {agenda ? "Edit agenda" : "Add agenda"}
      </PopoverTrigger>
      <PopoverContent>
        <form action={onSubmit} className="flex flex-col gap-2">
          <Label htmlFor={`agenda-${meetingId}`} className="sr-only">
            Agenda
          </Label>
          <Textarea
            id={`agenda-${meetingId}`}
            name="agenda"
            rows={3}
            defaultValue={agenda ?? ""}
            placeholder="Topics to cover"
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="min-h-11 px-4" disabled={pending}>
            {pending ? "Saving agenda" : "Save agenda"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
