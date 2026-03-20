"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  ChevronRight,
  Search,
  X,
  Clock,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LastMessage {
  body: string;
  senderType: string;
  senderName: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  subject: string | null;
  status: "OPEN" | "RESOLVED" | "ARCHIVED";
  lastMessageAt: string;
  partner: {
    firstName: string;
    lastName: string;
    companyName: string;
    email: string;
  };
  messages: LastMessage[];
  _count: { messages: number };
}

interface MessagesManagerProps {
  conversations: Conversation[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_TABS = ["ALL", "OPEN", "RESOLVED", "ARCHIVED"] as const;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  RESOLVED: "secondary",
  ARCHIVED: "outline",
};

function getPartnerWaitingTime(conversation: Conversation): {
  isWaiting: boolean;
  label: string;
} {
  const lastMsg = conversation.messages[0];
  if (!lastMsg) return { isWaiting: false, label: "" };

  // If the last message is from admin, they've responded
  if (lastMsg.senderType === "ADMIN") {
    return { isWaiting: false, label: "Responded" };
  }

  // Last message is from partner - calculate wait time
  const waitMs = Date.now() - new Date(lastMsg.createdAt).getTime();
  const waitMinutes = Math.floor(waitMs / 60000);
  const waitHours = Math.floor(waitMinutes / 60);
  const remainingMinutes = waitMinutes % 60;

  if (waitHours > 0) {
    return {
      isWaiting: true,
      label: `Partner waiting: ${waitHours}h ${remainingMinutes}m`,
    };
  }
  if (waitMinutes > 0) {
    return {
      isWaiting: true,
      label: `Partner waiting: ${waitMinutes}m`,
    };
  }
  return { isWaiting: true, label: "Partner waiting: <1m" };
}

/* ------------------------------------------------------------------ */
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MessagesManager({ conversations }: MessagesManagerProps) {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = conversations;

    // Filter by status tab
    if (activeTab !== "ALL") {
      result = result.filter((c) => c.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const subjectMatch = c.subject?.toLowerCase().includes(q);
        const partnerNameMatch =
          `${c.partner.firstName} ${c.partner.lastName}`.toLowerCase().includes(q);
        const companyMatch = c.partner.companyName.toLowerCase().includes(q);
        const emailMatch = c.partner.email.toLowerCase().includes(q);
        const messageMatch = c.messages[0]?.body.toLowerCase().includes(q);
        return subjectMatch || partnerNameMatch || companyMatch || emailMatch || messageMatch;
      });
    }

    return result;
  }, [conversations, activeTab, searchQuery]);

  // Total unread count across all conversations
  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c._count.messages, 0),
    [conversations]
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Messages"
          description={`${conversations.length} conversations${totalUnread > 0 ? ` -- ${totalUnread} unread` : ""}`}
        />

        {/* Search bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search by subject, partner, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {STATUS_TABS.map((tab) => {
              const count =
                tab === "ALL"
                  ? conversations.length
                  : conversations.filter((c) => c.status === tab).length;
              return (
                <TabsTrigger key={tab} value={tab}>
                  {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  {count > 0 && (
                    <span className="ml-1.5 text-xs bg-secondary-bg rounded-full px-1.5 py-0.5 tabular-nums">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {filtered.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-full bg-secondary-bg p-4 mb-4">
              <MessageSquare className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary font-display mb-1">
              No conversations
            </h3>
            <p className="text-sm text-text-secondary max-w-sm">
              {searchQuery.trim()
                ? "No conversations match your search. Try different search terms."
                : "No conversations found for the selected filter."}
            </p>
            {(searchQuery.trim() || activeTab !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("ALL");
                }}
                className="mt-4 text-sm text-citro-orange hover:text-citro-orange-dark font-medium transition-colors"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={listContainer}
            initial="hidden"
            animate="show"
          >
            {filtered.map((conversation) => {
              const unreadCount = conversation._count.messages;
              const lastMsg = conversation.messages[0];
              const hasUnread = unreadCount > 0;
              const responseTime = getPartnerWaitingTime(conversation);

              return (
                <motion.div key={conversation.id} variants={listItem}>
                  <Link href={`/admin/messages/${conversation.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                      <CardContent className="!p-4 sm:!p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {hasUnread && (
                                <span
                                  className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-citro-orange text-white text-[10px] font-bold tabular-nums shrink-0"
                                  aria-label={`${unreadCount} unread messages`}
                                >
                                  {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                              )}
                              <h3
                                className={cn(
                                  "text-sm truncate",
                                  hasUnread
                                    ? "font-semibold text-text-primary"
                                    : "font-medium text-text-primary"
                                )}
                              >
                                {conversation.subject || "No subject"}
                              </h3>
                              <Badge
                                variant={STATUS_VARIANT[conversation.status] ?? "outline"}
                                className="shrink-0"
                              >
                                {conversation.status.charAt(0) +
                                  conversation.status.slice(1).toLowerCase()}
                              </Badge>
                            </div>

                            <p className="text-xs text-text-secondary font-medium">
                              {conversation.partner.firstName} {conversation.partner.lastName}{" "}
                              <span className="text-text-muted font-normal">
                                -- {conversation.partner.companyName}
                              </span>
                              <span className="text-text-muted font-normal hidden sm:inline">
                                {" "}({conversation.partner.email})
                              </span>
                            </p>

                            {lastMsg && (
                              <p className="text-xs text-text-muted truncate max-w-[90%]">
                                <span className="text-text-secondary font-medium">
                                  {lastMsg.senderType === "ADMIN" ? "You" : lastMsg.senderName}:
                                </span>{" "}
                                {lastMsg.body.slice(0, 120)}
                              </p>
                            )}

                            {/* Response time indicator */}
                            {responseTime.label && (
                              <p
                                className={cn(
                                  "text-[11px] font-medium flex items-center gap-1",
                                  responseTime.isWaiting
                                    ? "text-warning"
                                    : "text-success"
                                )}
                              >
                                {responseTime.isWaiting ? (
                                  <Clock className="h-3 w-3" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                {responseTime.label}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-text-muted whitespace-nowrap">
                              {formatRelativeTime(conversation.lastMessageAt)}
                            </span>
                            <ChevronRight className="h-4 w-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
