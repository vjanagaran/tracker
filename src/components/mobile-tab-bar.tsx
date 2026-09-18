"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, mobileNav } from "@/components/app-nav";
import { cn } from "cn";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 overflow-hidden border-t border-border bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid w-full grid-cols-5">
        {mobileNav.map((item) => {
          const active = isNavActive(pathname, item);
          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full min-w-0 flex-col items-center justify-center gap-0.5 px-0.5 text-center text-[10px] leading-tight",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5 shrink-0 opacity-80" aria-hidden="true" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
