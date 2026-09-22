"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeft, PanelLeftClose, ShieldCheck, User } from "lucide-react";
import { desktopNav, isNavActive } from "@/components/app-nav";
import { Button } from "@/components/ui/button";
import type { MemberBoard } from "@/features/boards/types";
import { APP_NAME } from "@/lib/brand";
import { cn } from "cn";

type SidebarNavProps = {
  name: string;
  photoUrl?: string | null;
  isSuperadmin?: boolean;
  boards: MemberBoard[];
  open: boolean;
  onToggle: () => void;
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

function Avatar({ photoUrl, className }: { photoUrl: string | null; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sidebar-border bg-muted",
        className,
      )}
      aria-hidden="true"
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <User className="size-4 text-muted-foreground" />
      )}
    </span>
  );
}

export function SidebarNav({
  name,
  photoUrl = null,
  isSuperadmin = false,
  boards,
  open,
  onToggle,
}: SidebarNavProps) {
  const pathname = usePathname();
  const profileActive = pathname.startsWith("/profile");
  const adminActive = pathname.startsWith("/admin");

  if (!open) {
    const iconLinkClass = (active: boolean) =>
      cn(
        "flex size-8 items-center justify-center rounded-lg",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-foreground/[0.04]",
      );

    return (
      <aside
        id="app-sidebar"
        className="hidden h-full w-12 shrink-0 flex-col items-center overflow-y-auto border-r border-sidebar-border bg-sidebar pt-3 pb-3 md:flex"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-expanded={false}
          aria-controls="app-sidebar"
          title="Open sidebar (M)"
          aria-label="Open sidebar"
          onClick={onToggle}
        >
          <PanelLeft />
        </Button>
        <Link
          href="/profile"
          aria-current={profileActive ? "page" : undefined}
          title={name || "Profile"}
          className="mt-1 rounded-full"
        >
          <Avatar
            photoUrl={photoUrl}
            className={profileActive ? "ring-2 ring-sidebar-accent-foreground/20" : undefined}
          />
          <span className="sr-only">{name || "Profile"}</span>
        </Link>
        <nav className="mt-3 flex flex-col items-center gap-1">
          {desktopNav.map((item) => {
            const active =
              item.href === "/boards"
                ? pathname === "/boards" || pathname.startsWith("/boards/")
                : isNavActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={iconLinkClass(active)}
              >
                <item.icon className="size-4 opacity-80" aria-hidden="true" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
          {isSuperadmin ? (
            <>
              <div className="my-1 h-px w-6 bg-sidebar-border" role="separator" />
              <Link
                href="/admin/boards"
                aria-current={adminActive ? "page" : undefined}
                title="Boards admin"
                className={iconLinkClass(adminActive)}
              >
                <ShieldCheck className="size-4 opacity-80" aria-hidden="true" />
                <span className="sr-only">Boards admin</span>
              </Link>
            </>
          ) : null}
        </nav>
      </aside>
    );
  }

  return (
    <aside
      id="app-sidebar"
      className="hidden h-full w-[220px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar md:flex"
    >
      <div className="flex items-start gap-0.5 px-2 pt-3 pb-2">
        <Link
          href="/profile"
          aria-current={profileActive ? "page" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5",
            profileActive
              ? "bg-sidebar-accent"
              : "hover:bg-foreground/[0.04]",
          )}
        >
          <Avatar photoUrl={photoUrl} />
          <span className="min-w-0">
            <p className="truncate text-[13px] font-medium tracking-tight">
              {name || "Profile"}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{APP_NAME}</p>
          </span>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-0.5"
          aria-expanded={true}
          aria-controls="app-sidebar"
          title="Close sidebar (M)"
          aria-label="Close sidebar"
          onClick={onToggle}
        >
          <PanelLeftClose />
        </Button>
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
