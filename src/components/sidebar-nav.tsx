"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, User } from "lucide-react";
import { desktopNav, isNavActive } from "@/components/app-nav";
import type { MemberBoard } from "@/features/boards/types";
import { APP_NAME } from "@/lib/brand";
import { cn } from "cn";

type SidebarNavProps = {
  name: string;
  photoUrl?: string | null;
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

export function SidebarNav({
  name,
  photoUrl = null,
  isSuperadmin = false,
  boards,
}: SidebarNavProps) {
  const pathname = usePathname();
  const profileActive = pathname.startsWith("/profile");
  const adminActive = pathname.startsWith("/admin");

  return (
    <aside className="hidden md:sticky md:top-0 md:flex md:h-dvh md:w-[220px] md:shrink-0 md:flex-col md:self-start md:overflow-y-auto md:border-r md:border-sidebar-border md:bg-sidebar">
      <div className="px-2 pt-4 pb-3">
        <Link
          href="/profile"
          aria-current={profileActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2",
            profileActive
              ? "bg-sidebar-accent"
              : "hover:bg-foreground/[0.04]",
          )}
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sidebar-border bg-muted"
            aria-hidden="true"
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <User className="size-4 text-muted-foreground" />
            )}
          </span>
          <span className="min-w-0">
            <p className="truncate text-[13px] font-medium tracking-tight">
              {name || "Profile"}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{APP_NAME}</p>
          </span>
        </Link>
      </div>
      <nav className="flex flex-col gap-0.5 px-2 pb-4">
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
                {isSuperadmin ? (
                  <>
                    <div
                      className="mx-2 my-2 h-px bg-sidebar-border"
                      role="separator"
                    />
                    <Link
                      href="/admin/boards"
                      aria-current={adminActive ? "page" : undefined}
                      className={navLinkClass(adminActive)}
                    >
                      <ShieldCheck className="size-4 shrink-0 opacity-70" aria-hidden="true" />
                      Boards admin
                    </Link>
                  </>
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
    </aside>
  );
}
