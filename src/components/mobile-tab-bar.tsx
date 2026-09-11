"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav, isNavActive } from "@/components/app-nav";
import { cn } from "cn";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-4">
        {appNav.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
                  active
                    ? "font-medium text-primary"
                    : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
