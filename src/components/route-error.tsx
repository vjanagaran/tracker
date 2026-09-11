"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RouteError({ retry }: { retry: () => void }) {
  return (
    <div>
      <CircleAlert className="mb-3 size-6 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-tight">This page did not load</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        The last action did not finish. Try again, or open another screen from
        the menu.
      </p>
      <Button type="button" className="mt-4 min-h-11 px-4" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
