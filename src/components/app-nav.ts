import {
  Activity,
  Briefcase,
  LayoutDashboard,
  ListChecks,
  NotebookText,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
};

export const desktopNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/notes", label: "Notes", icon: NotebookText },
  { href: "/wheel/life", label: "Life", icon: Activity },
  { href: "/wheel/business", label: "Business", icon: Briefcase },
  { href: "/boards", label: "Board", icon: Users },
];

export const mobileNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/notes", label: "Notes", icon: NotebookText },
  {
    href: "/wheel/life",
    label: "Wheel",
    icon: Activity,
    matchPrefixes: ["/wheel", "/spoke"],
  },
  { href: "/boards", label: "Board", icon: Users },
];

export const appNav = desktopNav;

export function isNavActive(pathname: string, item: NavItem) {
  const prefixes = item.matchPrefixes ?? [item.href];
  return prefixes.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}
