"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar, type SidebarProps } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";

export interface PortalShellProps {
  children: React.ReactNode;
  role?: SidebarProps["role"];
  unreadCount?: number;
  isAdmin?: boolean;
}

export function PortalShell({
  children,
  role,
  unreadCount: initialUnreadCount = 0,
  isAdmin = false,
}: PortalShellProps) {
  // If this is the admin layout, always show admin sections
  const effectiveRole = isAdmin ? "admin" : role;

  // Reactively poll unread count so sidebar badge updates when messages are read
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["unreadCount"],
    queryFn: async () => {
      const res = await fetch("/api/conversations/unread");
      if (!res.ok) throw new Error("Failed to fetch unread count");
      return res.json();
    },
    initialData: { count: initialUnreadCount },
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.count ?? initialUnreadCount;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar role={effectiveRole} unreadCount={unreadCount} />

      {/* Mobile navigation (top bar + bottom tabs + drawer) */}
      <MobileNav role={effectiveRole} unreadCount={unreadCount} />

      {/* Main content area */}
      <main className="flex-1 min-w-0">
        <div className="px-4 py-4 lg:px-6 lg:py-6 pb-20 lg:pb-6">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>

      {/* First-time user welcome modal -- partner users only */}
      {effectiveRole !== "admin" && <WelcomeModal />}
    </div>
  );
}
