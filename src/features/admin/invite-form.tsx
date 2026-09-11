"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { toast } from "sonner";
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
import type { InviteActionResult } from "./types";

type InviteFormProps = {
  boardId: string;
  inviteMember: (input: unknown) => Promise<InviteActionResult>;
};

export function InviteForm({ boardId, inviteMember }: InviteFormProps) {
  const router = useRouter();
  const [role, setRole] = useState("director");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await inviteMember({
      boardId,
      email: String(formData.get("email") ?? ""),
      role,
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.success(result.message);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="pb-card max-w-md p-4">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Invite by email</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="min-h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onValueChange={(value) => setRole(value ?? "director")}>
            <SelectTrigger id="role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="director">Director</SelectItem>
              <SelectItem value="chairman">Chairman</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="min-h-11 px-4" disabled={pending}>
          <Send className="size-4" aria-hidden="true" />
          {pending ? "Inviting by email" : "Invite by email"}
        </Button>
      </div>
    </form>
  );
}
