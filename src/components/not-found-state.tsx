import Link from "next/link";
import { SearchX } from "lucide-react";

export function NotFoundState() {
  return (
    <div>
      <SearchX className="mb-3 size-6 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-tight">That page is not here</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        Check the address, or open the dashboard, a wheel or a board from the menu.
      </p>
      <p className="mt-4">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
        >
          Open the dashboard
        </Link>
      </p>
    </div>
  );
}
