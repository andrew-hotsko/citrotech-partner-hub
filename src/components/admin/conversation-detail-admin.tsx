"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Send,
  Building2,
  Mail,
  User,
  CheckCircle,
  Archive,
  RotateCcw,
  Package,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MessageData {
  id: string;
  senderType: "PARTNER" | "ADMIN";
  senderName: string;
  body: string;
  createdAt: string;
}

interface PartnerData {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  tier: string;
}

interface OrderRef {
  id: string;
  orderNumber: string;
}

interface ConversationData {
  id: string;
  subject: string | null;
  status: "OPEN" | "RESOLVED" | "ARCHIVED";
  orderId: string | null;
  order: OrderRef | null;
  createdAt: string;
  messages: MessageData[];
  partner: PartnerData;
}

interface ConversationDetailAdminProps {
  conversation: ConversationData;
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  OPEN: "default",
  RESOLVED: "secondary",
  ARCHIVED: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  RESOLVED: "Resolved",
  ARCHIVED: "Archived",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getPartnerWaitingInfo(messages: MessageData[]): {
  isWaiting: boolean;
  label: string;
} {
  if (messages.length === 0) return { isWaiting: false, label: "" };
  // Messages are sorted asc, so last message is at the end
  const lastMsg = messages[messages.length - 1];
  if (lastMsg.senderType === "ADMIN") {
    return { isWaiting: false, label: "" };
  }
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
    return { isWaiting: true, label: `Partner waiting: ${waitMinutes}m` };
  }
  return { isWaiting: true, label: "Partner waiting: <1m" };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ConversationDetailAdmin({
  conversation: initialConversation,
}: ConversationDetailAdminProps) {
  const router = useRouter();
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(initialConversation.messages.length);

  // Poll for new messages every 30 seconds
  const { data: conversation } = useQuery<ConversationData>({
    queryKey: ["admin-conversation", initialConversation.id],
    queryFn: async (): Promise<ConversationData> => {
      const res = await fetch(`/api/conversations/${initialConversation.id}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      const data = await res.json();
      return {
        id: data.id,
        subject: data.subject,
        status: data.status,
        createdAt: data.createdAt,
        orderId: data.orderId ?? null,
        order: data.order ?? null,
        messages: data.messages.map(
          (m: {
            id: string;
            senderType: "PARTNER" | "ADMIN";
            senderName: string;
            body: string;
            createdAt: string;
          }) => ({
            id: m.id,
            senderType: m.senderType,
            senderName: m.senderName,
            body: m.body,
            createdAt: m.createdAt,
          })
        ),
        partner: data.partner,
      };
    },
    initialData: initialConversation,
    refetchInterval: 30000,
  });

  // Auto-scroll to bottom on load and when new messages arrive
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("instant");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (conversation.messages.length > prevMessageCount.current) {
      scrollToBottom("smooth");
    }
    prevMessageCount.current = conversation.messages.length;
  }, [conversation.messages.length, scrollToBottom]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = replyBody.trim();
      if (!trimmed) return;

      setSending(true);
      try {
        const res = await fetch(
          `/api/conversations/${conversation.id}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: trimmed }),
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to send message");
        }

        setReplyBody("");
        toast.success("Message sent");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSending(false);
      }
    },
    [replyBody, conversation.id]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend(e as unknown as React.FormEvent);
      }
    },
    [handleSend]
  );

  const handleStatusUpdate = useCallback(
    async (newStatus: "OPEN" | "RESOLVED" | "ARCHIVED") => {
      setUpdatingStatus(true);
      try {
        const res = await fetch(`/api/conversations/${conversation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error("Failed to update status");
        toast.success(`Conversation marked as ${newStatus.toLowerCase()}`);
        router.refresh();
      } catch {
        toast.error("Failed to update conversation status");
      } finally {
        setUpdatingStatus(false);
      }
    },
    [conversation.id, router]
  );

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="shrink-0 space-y-3 pb-4 border-b border-border">
          <Link
            href="/admin/messages"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Messages
          </Link>

          {/* Related order link */}
          {conversation.orderId && conversation.order && (
            <Link
              href={`/admin/orders/${conversation.orderId}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-forest-teal hover:text-forest-teal-light transition-colors bg-forest-teal-muted rounded-lg px-3 py-1.5 w-fit"
            >
              <Package className="h-3.5 w-3.5" />
              Related to Order: {conversation.order.orderNumber}
            </Link>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold font-display text-text-primary truncate">
                  {conversation.subject || "No subject"}
                </h1>
                <Badge
                  variant={STATUS_VARIANT[conversation.status] ?? "outline"}
                  className="shrink-0"
                >
                  {STATUS_LABEL[conversation.status] ?? conversation.status}
                </Badge>
              </div>

              {/* Partner Info Bar */}
              <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <Link
                    href={`/admin/partners/${conversation.partner.id}`}
                    className="hover:text-citro-orange transition-colors font-medium text-text-secondary"
                  >
                    {conversation.partner.firstName} {conversation.partner.lastName}
                  </Link>
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {conversation.partner.companyName}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {conversation.partner.email}
                </span>
                {/* Partner waiting time */}
                {(() => {
                  const waitInfo = getPartnerWaitingInfo(conversation.messages);
                  if (!waitInfo.isWaiting) return null;
                  return (
                    <span className="flex items-center gap-1 text-warning font-medium">
                      <Clock className="h-3 w-3" />
                      {waitInfo.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Status Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {conversation.status !== "RESOLVED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("RESOLVED")}
                  disabled={updatingStatus}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Resolve
                </Button>
              )}
              {conversation.status !== "ARCHIVED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("ARCHIVED")}
                  disabled={updatingStatus}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Button>
              )}
              {conversation.status !== "OPEN" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate("OPEN")}
                  disabled={updatingStatus}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto py-4 space-y-4 scroll-smooth"
        >
          {conversation.messages.map((message, idx) => {
            const isAdmin = message.senderType === "ADMIN";

            return (
              <motion.div
                key={message.id}
                className={cn("flex", isAdmin ? "justify-end" : "justify-start")}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(idx * 0.03, 0.3),
                  duration: 0.2,
                }}
              >
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] space-y-1",
                    isAdmin && "flex flex-col items-end"
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-1",
                      isAdmin ? "text-forest-teal" : "text-text-secondary"
                    )}
                  >
                    {isAdmin ? `${message.senderName} (Admin)` : message.senderName}
                  </span>

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isAdmin
                        ? "bg-forest-teal-muted text-text-primary rounded-br-md"
                        : "bg-card border border-border text-text-primary rounded-bl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  </div>

                  <span className="text-[10px] text-text-muted font-mono px-1">
                    {formatRelativeTime(message.createdAt)}
                  </span>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply bar */}
        <div className="shrink-0 border-t border-border pt-4">
          <form onSubmit={handleSend} className="flex items-end gap-3">
            <Textarea
              placeholder="Type a reply... (Ctrl+Enter to send)"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              disabled={sending}
            />
            <Button
              type="submit"
              loading={sending}
              disabled={!replyBody.trim() || sending}
              className="shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
