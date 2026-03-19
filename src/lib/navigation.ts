import {
  Bell,
  FileText,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  MessageSquare,
  ShoppingCart,
  User,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: number;
}

/* ------------------------------------------------------------------ */
/*  Partner navigation                                                 */
/* ------------------------------------------------------------------ */

export const partnerNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FolderOpen, label: "Library", href: "/library" },
  { icon: ShoppingCart, label: "Orders", href: "/orders" },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Bell, label: "Announcements", href: "/announcements" },
];

export const supportNavItems: NavItem[] = [
  { icon: HelpCircle, label: "Support", href: "/support" },
  { icon: User, label: "Profile", href: "/profile" },
];

/* ------------------------------------------------------------------ */
/*  Admin navigation                                                   */
/* ------------------------------------------------------------------ */

export const adminNavItems: NavItem[] = [
  { icon: Users, label: "Partners", href: "/admin/partners" },
  { icon: FileText, label: "Documents", href: "/admin/documents" },
  { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
  { icon: MessageSquare, label: "Messages", href: "/admin/messages" },
  { icon: Bell, label: "Announcements", href: "/admin/announcements" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
