"use client";

import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteFriend } from "./actions";

export function InviteFriendForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await inviteFriend({
      email: String(formData.get("email") ?? ""),
    });
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    toast.success(result.message);
    formRef.current?.reset();
  }

  return (
    <section className="mt-10 max-w-md border-t border-border pt-8">
      <h2 className="text-sm font-medium tracking-tight">Invite a friend</h2>
      <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
        They get their own wheels, tasks and notes. They are not added to a board.
        You will not see their work.
      </p>
      <form ref={formRef} action={onSubmit} className="mt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="friend-email">Email</Label>
          <Input
            id="friend-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="min-h-11"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="min-h-11 w-fit px-4" disabled={pending}>
          <Send className="size-4" aria-hidden="true" />
          {pending ? "Inviting a friend" : "Invite a friend"}
        </Button>
      </form>
    </section>
  );
}
