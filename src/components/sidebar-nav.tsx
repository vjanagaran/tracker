"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, UserRound } from "lucide-react";
import { desktopNav, isNavActive } from "@/components/app-nav";
import type { MemberBoard } from "@/features/boards/types";
import { cn } from "cn";

type SidebarNavProps = {
  name: string;
  isSuperadmin?: boolean;
  boards: MemberBoard[];
};

const navLinkClass = (active: boolean) =>
  cn(
    "flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px]",
    active
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-sidebar-foreground hover:bg-foreground/[0.04]",
  );

const boardLinkClass = (active: boolean) =>
  cn(
    "flex min-h-9 items-center truncate rounded-lg px-2.5 text-[13px]",
    active
      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-foreground/[0.04]",
  );

export function SidebarNav({ name, isSuperadmin = false, boards }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-[220px] md:shrink-0 md:flex-col md:border-r md:border-sidebar-border md:bg-sidebar">
      <div className="px-4 pt-5 pb-4">
        <p className="text-[13px] font-medium tracking-tight">{name || "Profile"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Personal Board</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {desktopNav.map((item) => {
          if (item.href === "/boards") {
            const indexActive = pathname === "/boards";
            return (
              <div key={item.href} className="flex flex-col gap-0.5">
                <Link
                  href={item.href}
                  aria-current={indexActive ? "page" : undefined}
                  className={navLinkClass(indexActive)}
                >
                  <item.icon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
                  {item.label}
                </Link>
                {boards.length > 0 ? (
                  <ul className="flex flex-col gap-0.5 py-0.5 pl-8">
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

          const active = isNavActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={navLinkClass(active)}
            >
              <item.icon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex flex-col gap-0.5 px-2 pb-4">
        {isSuperadmin ? (
          <Link
            href="/admin/boards"
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            className={navLinkClass(pathname.startsWith("/admin"))}
          >
            <ShieldCheck className="size-4 shrink-0 opacity-70" aria-hidden="true" />
            Boards admin
          </Link>
        ) : null}
        <Link
          href="/profile"
          aria-current={pathname.startsWith("/profile") ? "page" : undefined}
          className={navLinkClass(pathname.startsWith("/profile"))}
        >
          <UserRound className="size-4 shrink-0 opacity-70" aria-hidden="true" />
          Profile
        </Link>
      </div>
    </aside>
  );
}
