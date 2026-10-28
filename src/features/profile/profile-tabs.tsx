"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const TABS = [
  { href: "/profile", label: "Personal", match: (path: string) => path === "/profile" },
  {
    href: "/profile/companies",
    label: "Companies",
    match: (path: string) => path.startsWith("/profile/companies"),
  },
];

export function ProfileTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Profile sections" className="mb-8 flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex min-h-11 items-center border-b-2 px-4 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
