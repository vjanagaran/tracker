import Link from "next/link";
import { User } from "lucide-react";
import { APP_NAME } from "@/lib/brand";

type MobileHeaderProps = {
  name: string;
  photoUrl?: string | null;
};

export function MobileHeader({ name, photoUrl = null }: MobileHeaderProps) {
  return (
    <header className="flex min-h-13 items-center justify-between border-b border-border bg-background px-4 md:hidden">
      <p className="truncate pr-3 text-sm font-medium tracking-tight">{APP_NAME}</p>
      <Link
        href="/profile"
        className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
          aria-hidden="true"
        >
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <User className="size-3.5 text-muted-foreground" />
          )}
        </span>
        <span className="max-w-[9rem] truncate">{name || "Profile"}</span>
      </Link>
    </header>
  );
}
