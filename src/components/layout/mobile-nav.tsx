"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderOpen,
  Menu,
  MessageSquare,
  Moon,
  ShoppingCart,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import {
  partnerNavItems,
  supportNavItems,
  adminNavItems,
  isActive,
  type NavItem,
} from "@/lib/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface MobileNavProps {
  role?: "partner" | "admin" | null;
  unreadCount?: number;
}

/* ------------------------------------------------------------------ */
/*  Tab bar items                                                      */
/* ------------------------------------------------------------------ */

interface TabItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  action?: "more";
}

const tabItems: TabItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Library", href: "/library", icon: FolderOpen },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Messages", href: "/messages", icon: MessageSquare },
  { label: "More", icon: Menu, action: "more" },
];

/* ------------------------------------------------------------------ */
/*  Drawer nav link                                                    */
/* ------------------------------------------------------------------ */

function DrawerLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150",
        "hover:bg-white/[0.06]",
        active
          ? "text-white bg-white/[0.08]"
          : "text-gray-400 hover:text-gray-200"
      )}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-citro-orange" />
      )}
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span>{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="ml-auto flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-citro-orange text-white text-[10px] font-bold leading-none">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Section label                                                      */
/* ------------------------------------------------------------------ */

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
      {label}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileNav                                                          */
/* ------------------------------------------------------------------ */

export function MobileNav({ role, unreadCount = 0 }: MobileNavProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [drawerOpen]);

  // Close on escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const mainNavWithBadges = partnerNavItems.map((item) => ({
    ...item,
    badge: item.href === "/messages" ? unreadCount : undefined,
  }));

  const adminNavWithBadges = adminNavItems.map((item) => ({
    ...item,
    badge: item.href === "/admin/messages" ? unreadCount : undefined,
  }));

  return (
    <div className="lg:hidden">
      {/* ---- Top bar ---- */}
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 bg-[#0D0D0D] border-b border-white/[0.06]">
        <img
          src="/logo.png"
          alt="CitroTech"
          className="h-6 w-auto object-contain"
        />

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center h-10 w-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ---- Drawer overlay ---- */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeDrawer}
              aria-hidden="true"
            />

            <motion.nav
              className="fixed top-0 left-0 bottom-0 z-50 w-[280px] max-w-[85vw] bg-[#0D0D0D] border-r border-white/[0.06] flex flex-col overflow-y-auto"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between h-14 px-5 border-b border-white/[0.06] shrink-0">
                <img
                  src="/logo.png"
                  alt="CitroTech"
                  className="h-6 w-auto object-contain"
                />
                <button
                  onClick={closeDrawer}
                  className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors duration-150"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer nav */}
              <div className="flex-1 px-3 py-4 space-y-0.5">
                {mainNavWithBadges.map((item) => (
                  <DrawerLink
                    key={item.href}
                    item={item}
                    active={isActive(pathname, item.href)}
                    onClick={closeDrawer}
                  />
                ))}

                <SectionLabel label="Support" />
                {supportNavItems.map((item) => (
                  <DrawerLink
                    key={item.href}
                    item={item}
                    active={isActive(pathname, item.href)}
                    onClick={closeDrawer}
                  />
                ))}

                {role === "admin" && (
                  <>
                    <SectionLabel label="Admin" />
                    {adminNavWithBadges.map((item) => (
                      <DrawerLink
                        key={item.href}
                        item={item}
                        active={isActive(pathname, item.href)}
                        onClick={closeDrawer}
                      />
                    ))}
                  </>
                )}
              </div>

              {/* Drawer footer */}
              <div className="shrink-0 border-t border-white/[0.06] p-3 space-y-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors duration-150 w-full"
                  aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                >
                  {theme === "light" ? (
                    <Moon className="h-[18px] w-[18px] shrink-0" />
                  ) : (
                    <Sun className="h-[18px] w-[18px] shrink-0" />
                  )}
                  <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
                </button>

                <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8",
                      },
                    }}
                  />
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ---- Bottom tab bar ---- */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-16 bg-[#0D0D0D] border-t border-white/[0.06] pb-safe"
        aria-label="Tab navigation"
      >
        {tabItems.map((tab) => {
          const Icon = tab.icon;

          if (tab.action === "more") {
            return (
              <button
                key="more"
                onClick={() => setDrawerOpen(true)}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-gray-500 hover:text-gray-300 transition-colors duration-150"
                aria-label="More options"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          }

          const active = isActive(pathname, tab.href!);
          const isMessages = tab.href === "/messages";

          return (
            <Link
              key={tab.href}
              href={tab.href!}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors duration-150",
                active ? "text-citro-orange" : "text-gray-500 hover:text-gray-300"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {isMessages && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-citro-orange text-white text-[9px] font-bold leading-none">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Spacers so content is not hidden behind fixed bars */}
      <div className="h-14" aria-hidden="true" />
    </div>
  );
}
