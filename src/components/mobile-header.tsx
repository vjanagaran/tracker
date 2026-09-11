import Link from "next/link";
import { UserRound } from "lucide-react";

type MobileHeaderProps = {
  name: string;
};

export function MobileHeader({ name }: MobileHeaderProps) {
  return (
    <header className="flex min-h-13 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <p className="text-sm font-medium tracking-tight">Personal Board</p>
      <Link
        href="/profile"
        className="flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground"
      >
        <UserRound className="size-4" aria-hidden="true" />
        {name || "Profile"}
      </Link>
    </header>
  );
}
