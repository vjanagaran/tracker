import { Inbox } from "lucide-react";

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex max-w-prose items-start gap-2 text-sm text-muted-foreground">
      <Inbox className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
