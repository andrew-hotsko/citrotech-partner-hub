"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
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
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "citrotech-sidebar-width";
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SidebarProps {
  role?: "partner" | "admin" | null;
  unreadCount?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getStoredWidth(): number {
  if (typeof window === "undefined") return DEFAULT_WIDTH;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WIDTH;
}

/* ------------------------------------------------------------------ */
/*  NavLink                                                            */
/* ------------------------------------------------------------------ */

function NavLink({
  item,
  active,
  collapsed,
  badge,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge?: number;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
        "hover:bg-white/[0.06]",
        active
          ? "text-white bg-white/[0.08]"
          : "text-gray-400 hover:text-gray-200",
        collapsed && "justify-center px-0"
      )}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
    >
      {/* Active indicator */}
      {active && (
        <motion.span
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-citro-orange"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}

      <Icon className="h-[18px] w-[18px] shrink-0" />

      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}

      {/* Unread badge */}
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-citro-orange text-white text-[10px] font-bold leading-none",
            collapsed
              ? "absolute top-1 right-1 h-4 w-4"
              : "ml-auto h-5 min-w-5 px-1.5"
          )}
          aria-label={`${badge} unread`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Section label                                                      */
/* ------------------------------------------------------------------ */

function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <hr className="my-2 border-white/10" />;
  }
  return (
    <p className="px-3 pt-5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
      {label}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

export function Sidebar({ role, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [collapsed, setCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Hydrate width from localStorage
  useEffect(() => {
    setWidth(getStoredWidth());
  }, []);

  // Persist width
  useEffect(() => {
    if (!collapsed) {
      try {
        localStorage.setItem(STORAGE_KEY, String(width));
      } catch {
        // ignore
      }
    }
  }, [width, collapsed]);

  /* ---- Resize handling ---- */
  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = width;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
        setWidth(next);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [width]
  );

  const currentWidth = collapsed ? COLLAPSED_WIDTH : width;

  // Inject nav items with badges
  const mainNavWithBadges = partnerNavItems.map((item) => ({
    ...item,
    badge: item.href === "/messages" ? unreadCount : undefined,
  }));

  const adminNavWithBadges = adminNavItems.map((item) => ({
    ...item,
    badge: item.href === "/admin/messages" ? unreadCount : undefined,
  }));

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-40 h-screen flex-col hidden lg:flex",
          "bg-[#0D0D0D] border-r border-white/[0.06]",
          "transition-[width] duration-200 ease-in-out",
          isResizing && "transition-none select-none"
        )}
        style={{ width: currentWidth }}
        aria-label="Main navigation"
      >
        {/* ---- Header / Logo ---- */}
        <div
          className={cn(
            "flex items-center shrink-0 h-16 border-b border-white/[0.06]",
            collapsed ? "justify-center px-2" : "px-5"
          )}
        >
          {collapsed ? (
            <img
              src="/logo.png"
              alt="CitroTech"
              className="h-7 w-auto object-contain"
            />
          ) : (
            <img
              src="/logo.png"
              alt="CitroTech"
              className="h-7 w-auto object-contain"
            />
          )}
        </div>

        {/* ---- Navigation ---- */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-0.5">
          {/* Main section */}
          {mainNavWithBadges.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              badge={item.badge}
            />
          ))}

          {/* Support section */}
          <SectionLabel label="Support" collapsed={collapsed} />
          {supportNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
            />
          ))}

          {/* Admin section */}
          {role === "admin" && (
            <>
              <SectionLabel label="Admin" collapsed={collapsed} />
              {adminNavWithBadges.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isActive(pathname, item.href)}
                  collapsed={collapsed}
                  badge={item.badge}
                />
              ))}
            </>
          )}
        </nav>

        {/* ---- Footer ---- */}
        <div
          className={cn(
            "shrink-0 border-t border-white/[0.06] p-3 space-y-2",
            collapsed && "flex flex-col items-center"
          )}
        >
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors duration-150 w-full",
              collapsed && "justify-center px-0"
            )}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? (
              <Moon className="h-[18px] w-[18px] shrink-0" />
            ) : (
              <Sun className="h-[18px] w-[18px] shrink-0" />
            )}
            {!collapsed && (
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            )}
          </button>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors duration-150 w-full",
              collapsed && "justify-center px-0"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-[18px] w-[18px] shrink-0" />
            ) : (
              <ChevronLeft className="h-[18px] w-[18px] shrink-0" />
            )}
            {!collapsed && <span>Collapse</span>}
          </button>

          {/* User button */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2",
              collapsed && "justify-center px-0"
            )}
          >
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>

        {/* ---- Resize handle ---- */}
        {!collapsed && (
          <div
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-citro-orange/30 active:bg-citro-orange/50 transition-colors duration-150 z-50"
            onMouseDown={startResize}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            tabIndex={0}
          />
        )}
      </aside>

      {/* Spacer to push content right on desktop */}
      <div
        className="hidden lg:block shrink-0 transition-[width] duration-200 ease-in-out"
        style={{ width: currentWidth }}
        aria-hidden="true"
      />
    </>
  );
}
