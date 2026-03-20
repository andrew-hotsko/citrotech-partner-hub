"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, ChevronDown, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
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
  isReadByAdmin?: boolean;
  // Optimistic message fields
  _optimistic?: boolean;
  _failed?: boolean;
  _tempId?: string;
}

interface ConversationData {
  id: string;
  subject: string | null;
  status: "OPEN" | "RESOLVED" | "ARCHIVED";
  createdAt: string;
  messages: MessageData[];
}

interface ConversationDetailProps {
  conversation: ConversationData;
}

/* ------------------------------------------------------------------ */
/*  Status badge helpers                                               */
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
/*  Hook: useVisibilityPolling                                         */
/* ------------------------------------------------------------------ */

function useIsTabVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handler = () => {
      setVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return visible;
}

/* ------------------------------------------------------------------ */
/*  Hook: useLastPollTime                                              */
/* ------------------------------------------------------------------ */

function useLastPollAgo(lastPollTime: number | null) {
  const [label, setLabel] = useState("Updated just now");

  useEffect(() => {
    if (!lastPollTime) return;

    const update = () => {
      const diff = Math.floor((Date.now() - lastPollTime) / 1000);
      if (diff < 5) setLabel("Updated just now");
      else if (diff < 60) setLabel(`Updated ${diff}s ago`);
      else setLabel(`Updated ${Math.floor(diff / 60)}m ago`);
    };

    update();
    const timer = setInterval(update, 5000);
    return () => clearInterval(timer);
  }, [lastPollTime]);

  return label;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ConversationDetail({
  conversation: initialConversation,
}: ConversationDetailProps) {
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<MessageData[]>([]);
  const [showNewMessagesBanner, setShowNewMessagesBanner] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<number | null>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef(initialConversation.messages.length);
  const userAtBottomRef = useRef(true);
  const isTabVisible = useIsTabVisible();
  const lastPollLabel = useLastPollAgo(lastPollTime);

  // Mark messages as read on mount and when new messages arrive
  const markAsRead = useCallback(async () => {
    try {
      await fetch(`/api/conversations/${initialConversation.id}`, {
        method: "GET",
      });
      // Invalidate the unread count query so sidebar updates
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    } catch {
      // silent fail
    }
  }, [initialConversation.id, queryClient]);

  // Mark as read on mount
  useEffect(() => {
    markAsRead();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for new messages every 5 seconds when tab is visible, stop when not
  const { data: conversation } = useQuery<ConversationData>({
    queryKey: ["conversation", initialConversation.id],
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${initialConversation.id}`);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      const data = await res.json();
      setLastPollTime(Date.now());

      // Also invalidate unread count on successful poll (marks messages read server-side)
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });

      return {
        id: data.id,
        subject: data.subject,
        status: data.status,
        createdAt: data.createdAt,
        messages: data.messages.map(
          (m: {
            id: string;
            senderType: "PARTNER" | "ADMIN";
            senderName: string;
            body: string;
            createdAt: string;
            isReadByAdmin?: boolean;
          }) => ({
            id: m.id,
            senderType: m.senderType,
            senderName: m.senderName,
            body: m.body,
            createdAt: m.createdAt,
            isReadByAdmin: m.isReadByAdmin,
          })
        ),
      };
    },
    initialData: initialConversation,
    refetchInterval: isTabVisible ? 5000 : false,
  });

  // Merge server messages with optimistic messages (remove optimistic ones that now exist on server)
  const displayMessages = useMemo(() => {
    const serverIds = new Set(conversation.messages.map((m) => m.id));
    // Keep optimistic messages that haven't appeared from server yet
    const pendingOptimistic = optimisticMessages.filter(
      (om) => !serverIds.has(om.id) && om._tempId
    );
    return [...conversation.messages, ...pendingOptimistic];
  }, [conversation.messages, optimisticMessages]);

  // Track scroll position to determine if user is at bottom
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 80;
    const isAtBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    userAtBottomRef.current = isAtBottom;
    if (isAtBottom) {
      setShowNewMessagesBanner(false);
    }
  }, []);

  // Auto-scroll to bottom on load
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("instant");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When new messages arrive from server
  useEffect(() => {
    const newCount = conversation.messages.length;
    if (newCount > prevMessageCount.current) {
      // Check if the newest messages are from admin (i.e. someone else sent them)
      const newMessages = conversation.messages.slice(prevMessageCount.current);
      const hasAdminMessages = newMessages.some((m) => m.senderType === "ADMIN");

      if (userAtBottomRef.current) {
        scrollToBottom("smooth");
      } else if (hasAdminMessages) {
        // User is scrolled up and new admin messages arrived
        setShowNewMessagesBanner(true);
      }

      // Clean up optimistic messages that are now confirmed
      setOptimisticMessages((prev) => {
        const serverIds = new Set(conversation.messages.map((m) => m.id));
        return prev.filter((om) => !serverIds.has(om.id) && om._tempId);
      });
    }
    prevMessageCount.current = newCount;
  }, [conversation.messages, conversation.messages.length, scrollToBottom]);

  const handleScrollToNewMessages = useCallback(() => {
    setShowNewMessagesBanner(false);
    scrollToBottom("smooth");
  }, [scrollToBottom]);

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const trimmed = replyBody.trim();
      if (!trimmed) return;

      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      // Create optimistic message
      const optimisticMsg: MessageData = {
        id: tempId,
        senderType: "PARTNER",
        senderName: "You",
        body: trimmed,
        createdAt: new Date().toISOString(),
        _optimistic: true,
        _tempId: tempId,
      };

      // Add to optimistic messages and clear input immediately
      setOptimisticMessages((prev) => [...prev, optimisticMsg]);
      setReplyBody("");
      setSending(true);

      // Scroll to bottom for own message
      setTimeout(() => scrollToBottom("smooth"), 50);

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

        // Message sent successfully - remove optimistic, refetch will bring real message
        setOptimisticMessages((prev) =>
          prev.filter((m) => m._tempId !== tempId)
        );

        // Immediately refetch to get the confirmed message
        queryClient.invalidateQueries({
          queryKey: ["conversation", conversation.id],
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch (err) {
        // Mark the optimistic message as failed
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...m, _failed: true, _optimistic: false } : m
          )
        );
        toast.error(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setSending(false);
      }
    },
    [replyBody, conversation.id, scrollToBottom, queryClient]
  );

  const handleRetry = useCallback(
    async (tempId: string) => {
      const failedMsg = optimisticMessages.find((m) => m._tempId === tempId);
      if (!failedMsg) return;

      // Reset to sending state
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m._tempId === tempId ? { ...m, _failed: false, _optimistic: true } : m
        )
      );

      try {
        const res = await fetch(
          `/api/conversations/${conversation.id}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: failedMsg.body }),
          }
        );

        if (!res.ok) {
          throw new Error("Failed to send message");
        }

        setOptimisticMessages((prev) =>
          prev.filter((m) => m._tempId !== tempId)
        );

        queryClient.invalidateQueries({
          queryKey: ["conversation", conversation.id],
        });
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      } catch {
        setOptimisticMessages((prev) =>
          prev.map((m) =>
            m._tempId === tempId ? { ...m, _failed: true, _optimistic: false } : m
          )
        );
        toast.error("Failed to send message. Try again.");
      }
    },
    [optimisticMessages, conversation.id, queryClient]
  );

  const handleDismissFailedMessage = useCallback((tempId: string) => {
    setOptimisticMessages((prev) =>
      prev.filter((m) => m._tempId !== tempId)
    );
  }, []);

  // Handle Ctrl+Enter / Cmd+Enter to send
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend(e as unknown as React.FormEvent);
      }
    },
    [handleSend]
  );

  return (
    <PageTransition>
      <div className="flex flex-col h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-6rem)]">
        {/* Header */}
        <div className="shrink-0 space-y-3 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Link
              href="/messages"
              className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Messages
            </Link>

            {/* Connection indicator */}
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    isTabVisible ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
                <span className="hidden sm:inline">
                  {isTabVisible ? "Connected" : "Paused"}
                </span>
              </span>
              <span className="text-text-muted/60 hidden sm:inline">
                {lastPollLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
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
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="relative flex-1 overflow-y-auto py-4 space-y-4 scroll-smooth"
        >
          {displayMessages.map((message, idx) => {
            const isPartner = message.senderType === "PARTNER";
            const isOptimistic = message._optimistic;
            const isFailed = message._failed;

            return (
              <motion.div
                key={message.id}
                className={cn(
                  "flex",
                  isPartner ? "justify-end" : "justify-start"
                )}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: isFailed ? 0.7 : 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3), duration: 0.2 }}
              >
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] space-y-1",
                    isPartner && "flex flex-col items-end"
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-1",
                      isPartner ? "text-citro-orange" : "text-text-secondary"
                    )}
                  >
                    {isPartner ? "You" : message.senderName}
                  </span>

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                      isPartner
                        ? "bg-citro-orange-light text-text-primary rounded-br-md"
                        : "bg-card border border-border text-text-primary rounded-bl-md",
                      isFailed && "border-2 border-error/50"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {message.body}
                    </p>
                  </div>

                  {/* Status indicators */}
                  <div className="flex items-center gap-2 px-1">
                    {isOptimistic && !isFailed && (
                      <span className="text-[10px] text-text-muted font-mono italic">
                        Sending...
                      </span>
                    )}
                    {isFailed && (
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] text-error font-mono">
                          Failed to send
                        </span>
                        <button
                          onClick={() => handleRetry(message._tempId!)}
                          className="inline-flex items-center gap-1 text-[10px] text-citro-orange hover:text-citro-orange-dark font-medium transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Retry
                        </button>
                        <button
                          onClick={() => handleDismissFailedMessage(message._tempId!)}
                          className="text-[10px] text-text-muted hover:text-text-secondary font-medium transition-colors"
                        >
                          Dismiss
                        </button>
                      </span>
                    )}
                    {!isOptimistic && !isFailed && (
                      <span className="text-[10px] text-text-muted font-mono">
                        {formatRelativeTime(message.createdAt)}
                      </span>
                    )}
                    {/* Read by CitroTech indicator for partner messages */}
                    {isPartner &&
                      !isOptimistic &&
                      !isFailed &&
                      message.isReadByAdmin && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-text-muted">
                          <Check className="h-2.5 w-2.5" />
                          Read
                        </span>
                      )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* New messages banner */}
        <AnimatePresence>
          {showNewMessagesBanner && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 bottom-32 z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={handleScrollToNewMessages}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-citro-orange text-white text-sm font-medium shadow-lg hover:bg-citro-orange-dark transition-colors"
              >
                New messages
                <ChevronDown className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply bar */}
        <div className="shrink-0 border-t border-border pt-4">
          <form
            onSubmit={handleSend}
            className="flex items-end gap-3"
          >
            <Textarea
              placeholder="Type a message... (Ctrl+Enter to send)"
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
