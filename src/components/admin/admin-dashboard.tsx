"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  UserCheck,
  ShoppingCart,
  MessageSquare,
  FileText,
  ChevronRight,
  Clock,
  Package,
  UserPlus,
  Upload,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KPIs {
  totalPartners: number;
  activePartners: number;
  pendingOrders: number;
  unreadMessages: number;
  totalDocuments: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  projectName: string | null;
  createdAt: string;
  partner: { firstName: string; lastName: string; companyName: string };
  items: Array<{ product: string; quantity: number }>;
}

interface RecentConversation {
  id: string;
  subject: string | null;
  status: string;
  lastMessageAt: string;
  partner: { firstName: string; lastName: string; companyName: string };
  messages: Array<{ body: string; senderType: string; senderName: string }>;
}

interface AdminDashboardProps {
  kpis: KPIs;
  recentOrders: RecentOrder[];
  recentConversations: RecentConversation[];
}

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
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

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-status-submitted/15 text-status-submitted",
  CONFIRMED: "bg-status-confirmed/15 text-status-confirmed",
  PROCESSING: "bg-status-processing/15 text-status-processing",
  SHIPPED: "bg-status-shipped/15 text-status-shipped",
  DELIVERED: "bg-status-delivered/15 text-status-delivered",
  CANCELLED: "bg-status-cancelled/15 text-status-cancelled",
};

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

interface KpiCardConfig {
  label: string;
  value: number;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href: string;
  subtitle?: string;
}

function KpiCard({ label, value, icon: Icon, iconBg, iconColor, href, subtitle }: KpiCardConfig) {
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
                  {value.toLocaleString()}
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

function QuickAction({
  href,
  icon: Icon,
  title,
  iconBg,
  iconColor,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Card className="hover:shadow-md transition-shadow duration-300 cursor-pointer h-full border border-border/50 hover:border-border group">
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
              <p className="text-sm font-semibold text-text-primary">{title}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminDashboard({
  kpis,
  recentOrders,
  recentConversations,
}: AdminDashboardProps) {
  return (
    <PageTransition>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <PageHeader
            title="Admin Dashboard"
            description="Overview of your partner hub activity."
          />
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
          variants={itemVariants}
        >
          <KpiCard
            label="Total Partners"
            value={kpis.totalPartners}
            icon={Users}
            iconBg="bg-forest-teal/10"
            iconColor="text-forest-teal"
            href="/admin/partners"
            subtitle={`${kpis.activePartners} active`}
          />
          <KpiCard
            label="Active Partners"
            value={kpis.activePartners}
            icon={UserCheck}
            iconBg="bg-forest-teal/10"
            iconColor="text-forest-teal"
            href="/admin/partners"
          />
          <KpiCard
            label="Pending Orders"
            value={kpis.pendingOrders}
            icon={ShoppingCart}
            iconBg="bg-citro-orange/10"
            iconColor="text-citro-orange"
            href="/admin/orders"
            subtitle={kpis.pendingOrders > 0 ? "Requires attention" : "All clear"}
          />
          <KpiCard
            label="Unread Messages"
            value={kpis.unreadMessages}
            icon={MessageSquare}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
            href="/admin/messages"
            subtitle={kpis.unreadMessages > 0 ? "New replies" : "All read"}
          />
          <KpiCard
            label="Total Documents"
            value={kpis.totalDocuments}
            icon={FileText}
            iconBg="bg-violet-500/10"
            iconColor="text-violet-500"
            href="/admin/documents"
          />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickAction
              href="/admin/partners?action=create"
              icon={UserPlus}
              title="Add Partner"
              iconBg="bg-forest-teal/10"
              iconColor="text-forest-teal"
            />
            <QuickAction
              href="/admin/documents?action=upload"
              icon={Upload}
              title="Upload Document"
              iconBg="bg-violet-500/10"
              iconColor="text-violet-500"
            />
            <QuickAction
              href="/admin/announcements?action=create"
              icon={Megaphone}
              title="Create Announcement"
              iconBg="bg-citro-orange/10"
              iconColor="text-citro-orange"
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Link
                    href="/admin/orders"
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
                      Orders from your partners will appear here once they start placing them.
                    </p>
                    <Link href="/admin/orders">
                      <Button variant="outline" size="sm">
                        View Orders Page
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-secondary-bg transition-colors group"
                      >
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-mono font-semibold text-text-primary">
                              {order.orderNumber}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                statusColors[order.status] ?? "bg-secondary-bg text-text-secondary"
                              )}
                            >
                              {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted truncate">
                            {order.partner.companyName} -- {order.partner.firstName} {order.partner.lastName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-text-muted inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0" />
                            {formatDate(order.createdAt)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Conversations */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Conversations</CardTitle>
                  <Link
                    href="/admin/messages"
                    className="text-sm text-citro-orange hover:underline font-medium flex items-center gap-1"
                  >
                    View all <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/10 mb-4">
                      <MessageSquare className="h-7 w-7 text-blue-500" />
                    </div>
                    <p className="text-sm font-medium text-text-primary mb-1">
                      No conversations yet
                    </p>
                    <p className="text-xs text-text-muted mb-4 max-w-[220px]">
                      Conversations with your partners will appear here as they reach out.
                    </p>
                    <Link href="/admin/messages">
                      <Button variant="outline" size="sm">
                        View Messages
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentConversations.map((conv) => {
                      const lastMsg = conv.messages[0];
                      return (
                        <Link
                          key={conv.id}
                          href={`/admin/messages/${conv.id}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-secondary-bg transition-colors group"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-sm font-medium text-text-primary truncate">
                              {conv.subject || "No subject"}
                            </p>
                            <p className="text-xs text-text-muted truncate">
                              {conv.partner.companyName}
                              {lastMsg && (
                                <>
                                  {" -- "}
                                  {lastMsg.body.slice(0, 60)}
                                  {lastMsg.body.length > 60 ? "..." : ""}
                                </>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-text-muted whitespace-nowrap">
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
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
