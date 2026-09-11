import { Activity, Briefcase, ListChecks, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const appNav: NavItem[] = [
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/wheel/life", label: "Life", icon: Activity },
  { href: "/wheel/business", label: "Business", icon: Briefcase },
  { href: "/boards", label: "Board", icon: Users },
];

export function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
