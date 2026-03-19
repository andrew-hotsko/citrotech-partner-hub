"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  FolderOpen,
  MessageSquare,
  Bell,
  AlertTriangle,
  Mail,
  Package,
  ChevronRight,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/layout/page-transition";
import { cn } from "@/lib/utils";
import { formatDate, formatOrderNumber } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardPartner {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  tier: "REGISTERED" | "CERTIFIED" | "PREMIER";
  certExpiresAt: string | null;
}

interface DashboardOrder {
  id: string;
  orderNumber: string;
  status: string;
  projectName: string | null;
  createdAt: string;
}

interface DashboardAnnouncement {
  id: string;
  title: string;
  type: "INFO" | "PRODUCT" | "TRAINING" | "URGENT";
  publishedAt: string;
}

interface DashboardContentProps {
  partner: DashboardPartner;
  recentOrders: DashboardOrder[];
  recentAnnouncements: DashboardAnnouncement[];
  unreadMessageCount: number;
}

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getTierConfig(tier: DashboardPartner["tier"]) {
  const config: Record<
    DashboardPartner["tier"],
    { label: string; variant: "default" | "secondary" | "outline"; color: string }
  > = {
    CERTIFIED: { label: "Certified Partner", variant: "default", color: "bg-citro-orange/15 text-citro-orange" },
    PREMIER: { label: "Premier Partner", variant: "secondary", color: "bg-forest-teal/15 text-forest-teal" },
    REGISTERED: { label: "Registered Partner", variant: "outline", color: "" },
  };
  return config[tier];
}

function isCertExpiringWithinDays(certExpiresAt: string | null, days: number): boolean {
  if (!certExpiresAt) return false;
  const expiry = new Date(certExpiresAt);
  const now = new Date();
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= days;
}

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-status-submitted/15 text-status-submitted",
  CONFIRMED: "bg-status-confirmed/15 text-status-confirmed",
  PROCESSING: "bg-status-processing/15 text-status-processing",
  SHIPPED: "bg-status-shipped/15 text-status-shipped",
  DELIVERED: "bg-status-delivered/15 text-status-delivered",
  CANCELLED: "bg-status-cancelled/15 text-status-cancelled",
};

const announcementBorderColors: Record<DashboardAnnouncement["type"], string> = {
  INFO: "border-l-info",
  PRODUCT: "border-l-forest-teal",
  TRAINING: "border-l-citro-orange",
  URGENT: "border-l-error",
};

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  subtitle,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href: string;
  subtitle?: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group h-full border border-border/50 hover:border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-text-secondary">{label}</p>
                <p className="text-3xl font-bold text-text-primary tabular-nums">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                {subtitle && (
                  <p className="text-xs text-text-muted">{subtitle}</p>
                )}
              </div>
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                  iconBg
                )}
              >
                <Icon className={cn("h-5 w-5", iconColor)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Quick Action Card                                                  */
/* ------------------------------------------------------------------ */

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  iconBg,
  iconColor,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Card className="hover:shadow-md transition-shadow duration-300 cursor-pointer h-full border border-border/50 hover:border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                iconBg
              )}
            >
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text-primary">{title}</p>
                {badge}
              </div>
              <p className="text-xs text-text-muted mt-0.5">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DashboardContent({
  partner,
  recentOrders,
  recentAnnouncements,
  unreadMessageCount,
}: DashboardContentProps) {
  const certExpiring60 = isCertExpiringWithinDays(partner.certExpiresAt, 60);
  const tierConfig = getTierConfig(partner.tier);

  return (
    <PageTransition>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Welcome Banner ──────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <Card className="border border-border/50 bg-gradient-to-r from-forest-teal/5 to-citro-orange/5 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
                    {getGreeting()}, {partner.firstName}!
                  </h1>
                  <p className="text-sm text-text-secondary">
                    {partner.companyName}
                  </p>
                  {partner.certExpiresAt && (
                    <p className="text-xs text-text-muted">
                      Certified until {formatDate(partner.certExpiresAt)}
                    </p>
                  )}
                </div>
                <Badge variant={tierConfig.variant} className={cn("text-sm px-3 py-1", tierConfig.color)}>
                  {tierConfig.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Certification Alert ─────────────────────────────── */}
        {certExpiring60 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Certification expiring soon
                </p>
                <p className="text-sm text-text-secondary mt-0.5">
                  Your certification expires on{" "}
                  {formatDate(partner.certExpiresAt!)}. Contact us to begin the
                  renewal process before it lapses.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Unread Messages Alert ───────────────────────────── */}
        {unreadMessageCount > 0 && (
          <motion.div variants={itemVariants}>
            <Link href="/messages">
              <div className="flex items-start gap-3 rounded-lg border border-citro-orange/30 bg-citro-orange/10 p-4 hover:bg-citro-orange/15 transition-colors">
                <Mail className="h-5 w-5 text-citro-orange shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    You have {unreadMessageCount} unread{" "}
                    {unreadMessageCount === 1 ? "message" : "messages"}
                  </p>
                  <p className="text-sm text-text-secondary mt-0.5">
                    Click to view your conversations
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* ── Quick Actions ───────────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickActionCard
              href="/library"
              icon={FolderOpen}
              title="Browse Library"
              description="Access documents and resources"
              iconBg="bg-forest-teal/10"
              iconColor="text-forest-teal"
            />
            <QuickActionCard
              href="/orders"
              icon={ShoppingCart}
              title="Place Order"
              description="Submit a new product order"
              iconBg="bg-citro-orange/10"
              iconColor="text-citro-orange"
            />
            <QuickActionCard
              href="/messages"
              icon={MessageSquare}
              title="Send Message"
              description="Start a new conversation"
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
              badge={
                unreadMessageCount > 0 ? (
                  <Badge variant="default">{unreadMessageCount}</Badge>
                ) : undefined
              }
            />
          </div>
        </motion.div>

        {/* ── Recent Orders & Announcements ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Link
                    href="/orders"
                    className="text-sm text-citro-orange hover:underline font-medium flex items-center gap-1"
                  >
                    View all <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-citro-orange/10 mb-4">
                      <Package className="h-7 w-7 text-citro-orange" />
                    </div>
                    <p className="text-sm font-medium text-text-primary mb-1">
                      No orders yet
                    </p>
                    <p className="text-xs text-text-muted mb-4 max-w-[220px]">
                      Start ordering products to track your purchase history here.
                    </p>
                    <Link href="/orders">
                      <Button variant="default" size="sm">
                        Place your first order
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-bg transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-mono text-text-primary font-medium">
                            {formatOrderNumber(
                              parseInt(order.orderNumber.replace(/\D/g, ""), 10)
                            )}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                              statusColors[order.status] ?? "bg-secondary-bg text-text-secondary"
                            )}
                          >
                            {order.status.charAt(0) +
                              order.status.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Latest Announcements */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Latest Announcements</CardTitle>
                  <Link
                    href="/announcements"
                    className="text-sm text-citro-orange hover:underline font-medium flex items-center gap-1"
                  >
                    View all <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentAnnouncements.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-violet-500/10 mb-4">
                      <Bell className="h-7 w-7 text-violet-500" />
                    </div>
                    <p className="text-sm font-medium text-text-primary mb-1">
                      No announcements yet
                    </p>
                    <p className="text-xs text-text-muted max-w-[220px]">
                      Important news and updates from CitroTech will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentAnnouncements.map((announcement) => (
                      <Link
                        key={announcement.id}
                        href="/announcements"
                        className={cn(
                          "block p-3 rounded-lg border-l-4 hover:bg-secondary-bg transition-colors",
                          announcementBorderColors[announcement.type]
                        )}
                      >
                        <p className="text-sm font-medium text-text-primary line-clamp-1">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {formatDate(announcement.publishedAt)}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </PageTransition>
  );
}
