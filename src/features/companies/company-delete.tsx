"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { deleteCompany } from "./actions";

export function CompanyDelete({ companyId, name }: { companyId: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    const result = await deleteCompany(companyId);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success("Company deleted.");
    router.push("/profile/companies");
  }

  return (
    <section className="mt-10 border-t border-border pt-6" aria-label="Delete company">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 border-destructive/40 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
        Delete company
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Removes this company, its logo and its brochure. Turn off sharing to keep it to yourself
        instead.
      </p>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this company</AlertDialogTitle>
            <AlertDialogDescription>
              “{name}” will be removed for good, with its logo and brochure. People on your boards
              will no longer see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep company</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => void remove()}
            >
              {pending ? "Deleting company" : "Delete company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
