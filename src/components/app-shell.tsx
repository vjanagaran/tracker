"use client";

import { useEffect, useState } from "react";
import { MobileHeader } from "@/components/mobile-header";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SidebarNav } from "@/components/sidebar-nav";
import type { MemberBoard } from "@/features/boards/types";

const SIDEBAR_OPEN_KEY = "hgt.sidebar-open";

type AppShellProps = {
  name: string;
  photoUrl?: string | null;
  isSuperadmin?: boolean;
  boards: MemberBoard[];
  children: React.ReactNode;
};

export function AppShell({
  name,
  photoUrl = null,
  isSuperadmin = false,
  boards,
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOpen(window.localStorage.getItem(SIDEBAR_OPEN_KEY) !== "0");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(SIDEBAR_OPEN_KEY, open ? "1" : "0");
  }, [open, ready]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "m" && event.key !== "M") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest("input, textarea, select, [contenteditable=true], [role=textbox]")) {
        return;
      }
      if (!window.matchMedia("(min-width: 768px)").matches) return;
      event.preventDefault();
      setOpen((current) => !current);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-dvh overflow-hidden">
      <SidebarNav
        name={name}
        photoUrl={photoUrl}
        isSuperadmin={isSuperadmin}
        boards={boards}
        open={open}
        onToggle={() => setOpen((current) => !current)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <MobileHeader name={name} photoUrl={photoUrl} />
        <main
          id="main"
          className="min-w-0 flex-1 px-5 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-10 md:py-9 md:pb-10"
        >
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
