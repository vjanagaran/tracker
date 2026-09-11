"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { appNav, isNavActive } from "@/components/app-nav";
import type { MemberBoard } from "@/features/boards/types";
import { cn } from "cn";

type SidebarNavProps = {
  name: string;
  isSuperadmin?: boolean;
  boards: MemberBoard[];
};

const navLinkClass = (active: boolean) =>
  cn(
    "flex min-h-11 items-center gap-2.5 rounded-md px-3 text-sm",
    active
      ? "bg-sidebar-accent font-medium text-sidebar-primary"
      : "text-sidebar-foreground hover:bg-sidebar-accent",
  );

const boardLinkClass = (active: boolean) =>
  cn(
    "flex min-h-9 items-center truncate rounded-md px-3 text-sm",
    active
      ? "bg-sidebar-accent font-medium text-sidebar-primary"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent",
  );

export function SidebarNav({ name, isSuperadmin = false, boards }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-56 md:shrink-0 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
      <div className="px-5 pt-6 pb-5">
        <p className="text-base font-semibold tracking-tight">Personal Board</p>
        <p className="mt-1 text-xs text-muted-foreground">{name || "Profile"}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {appNav.map((item) => {
          if (item.href === "/boards") {
            const indexActive = pathname === "/boards";
            return (
              <div key={item.href} className="flex flex-col gap-0.5">
                <Link
                  href={item.href}
                  aria-current={indexActive ? "page" : undefined}
                  className={navLinkClass(indexActive)}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </Link>
                {boards.length > 0 ? (
                  <ul className="flex flex-col gap-0.5 py-0.5 pl-[2.125rem]">
                    {boards.map((board) => {
                      const boardActive = pathname.startsWith(`/boards/${board.id}`);
                      return (
                        <li key={board.id}>
                          <Link
                            href={`/boards/${board.id}`}
                            aria-current={boardActive ? "page" : undefined}
                            className={boardLinkClass(boardActive)}
                          >
                            {board.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          }

          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-1 px-2 pb-4">
        {isSuperadmin ? (
          <Link
            href="/admin/boards"
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            className={navLinkClass(pathname.startsWith("/admin"))}
          >
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            Boards admin
          </Link>
        ) : null}
        <Link
          href="/profile"
          aria-current={pathname.startsWith("/profile") ? "page" : undefined}
          className={navLinkClass(pathname.startsWith("/profile"))}
        >
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          Profile
        </Link>
      </div>
    </aside>
  );
}
