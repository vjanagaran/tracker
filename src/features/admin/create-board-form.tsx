"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBoard } from "./actions";

const WEEKDAYS = [
  { value: "", label: "No fixed weekday" },
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
] as const;

export function CreateBoardForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [meetingWeekday, setMeetingWeekday] = useState("4");

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createBoard({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      cadenceDays: String(formData.get("cadenceDays") ?? "15"),
      meetingWeekday,
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success("Board created.");
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
        Create a board
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a board</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Board name</Label>
            <Input id="name" name="name" required className="min-h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" className="min-h-11" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cadenceDays">Cadence in days</Label>
              <Input
                id="cadenceDays"
                name="cadenceDays"
                type="number"
                min={1}
                max={60}
                defaultValue={15}
                className="min-h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="meetingWeekday">Meets on</Label>
              <Select
                value={meetingWeekday}
                onValueChange={(value) => setMeetingWeekday(value ?? "")}
              >
                <SelectTrigger id="meetingWeekday" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" className="min-h-11 px-4" disabled={pending}>
              <Plus className="size-4" aria-hidden="true" />
              {pending ? "Creating a board" : "Create a board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
