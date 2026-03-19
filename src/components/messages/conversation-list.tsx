"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  ChevronRight,
  Send,
  Search,
  X,
  ShoppingCart,
  Wrench,
  Award,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LastMessage {
  body: string;
  senderType: "PARTNER" | "ADMIN";
  senderName: string;
}

interface Conversation {
  id: string;
  subject: string | null;
  status: "OPEN" | "RESOLVED" | "ARCHIVED";
  lastMessageAt: string;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SUBJECT_MIN_LENGTH = 3;
const BODY_MAX_LENGTH = 5000;

type StatusFilter = "ALL" | "OPEN" | "RESOLVED";

/* ------------------------------------------------------------------ */
/*  Quick-start templates                                              */
/* ------------------------------------------------------------------ */

const QUICK_START_TOPICS = [
  {
    label: "Order Inquiry",
    subject: "Order Inquiry",
    icon: ShoppingCart,
    description: "Questions about orders, shipping, or delivery",
  },
  {
    label: "Technical Support",
    subject: "Technical Support",
    icon: Wrench,
    description: "Product installation or technical issues",
  },
  {
    label: "Certification Question",
    subject: "Certification Question",
    icon: Award,
    description: "Certification status, renewal, or requirements",
  },
  {
    label: "General Inquiry",
    subject: "General Inquiry",
    icon: HelpCircle,
    description: "Other questions or feedback",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Hook: useIsTabVisible                                              */
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
/*  Animation                                                          */
/* ------------------------------------------------------------------ */

const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ConversationList({
  conversations: initialConversations,
}: ConversationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isTabVisible = useIsTabVisible();

  // Form state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [formErrors, setFormErrors] = useState<{ subject?: string; body?: string }>({});

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Poll for updates every 15 seconds when tab is visible, stop when not
  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      return data.map(
        (c: {
          id: string;
          subject: string | null;
          status: "OPEN" | "RESOLVED" | "ARCHIVED";
          lastMessageAt: string;
          messages?: Array<{
            body: string;
            senderType: "PARTNER" | "ADMIN";
            senderName: string;
          }>;
          _count?: { messages: number };
        }) => ({
          id: c.id,
          subject: c.subject,
          status: c.status,
          lastMessageAt: c.lastMessageAt,
          lastMessage: c.messages?.[0]
            ? {
                body: c.messages[0].body,
                senderType: c.messages[0].senderType,
                senderName: c.messages[0].senderName,
              }
            : null,
          unreadCount: c._count?.messages ?? 0,
        })
      );
    },
    initialData: initialConversations,
    refetchInterval: isTabVisible ? 15000 : false,
  });

  // Filtered and searched conversations
  const filteredConversations = useMemo(() => {
    let result = conversations;

    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const subjectMatch = c.subject?.toLowerCase().includes(query);
        const messageMatch = c.lastMessage?.body.toLowerCase().includes(query);
        return subjectMatch || messageMatch;
      });
    }

    return result;
  }, [conversations, statusFilter, searchQuery]);

  const resetForm = useCallback(() => {
    setSubject("");
    setBody("");
    setFormErrors({});
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: { subject?: string; body?: string } = {};

    if (!subject.trim()) {
      errors.subject = "Subject is required.";
    } else if (subject.trim().length < SUBJECT_MIN_LENGTH) {
      errors.subject = `Subject must be at least ${SUBJECT_MIN_LENGTH} characters.`;
    }

    if (!body.trim()) {
      errors.body = "Message body is required.";
    }

    if (body.length > BODY_MAX_LENGTH) {
      errors.body = `Message must be under ${BODY_MAX_LENGTH} characters.`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [subject, body]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      setSubmitting(true);
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: subject.trim(),
            body: body.trim(),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create conversation");
        }

        const newConversation = await res.json();

        toast.success("Message sent!");
        setDialogOpen(false);
        resetForm();

        // Invalidate queries so list refreshes
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["unreadCount"] });

        // Navigate to the new conversation
        router.push(`/messages/${newConversation.id}`);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setSubmitting(false);
      }
    },
    [subject, body, resetForm, router, validateForm, queryClient]
  );

  const handleSelectTopic = useCallback((topicSubject: string) => {
    setSubject(topicSubject);
  }, []);

  const hasActiveSearch = searchQuery.trim().length > 0 || statusFilter !== "ALL";

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Messages"
          description="Communicate directly with the CitroTech team."
        >
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New Message
          </Button>
        </PageHeader>

        {/* New Conversation Dialog */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>
                Start a new conversation with the CitroTech team.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit}>
              <div className="p-6 pt-4 space-y-5">
                {/* Quick-start topic buttons */}
                {!subject.trim() && (
                  <div className="space-y-2">
                    <Label className="text-xs text-text-secondary">
                      Quick Start
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_START_TOPICS.map((topic) => {
                        const Icon = topic.icon;
                        return (
                          <button
                            key={topic.label}
                            type="button"
                            onClick={() => handleSelectTopic(topic.subject)}
                            className="flex items-start gap-2.5 p-3 rounded-lg border border-border bg-card hover:bg-secondary-bg hover:border-citro-orange/40 transition-all text-left group"
                          >
                            <Icon className="h-4 w-4 text-text-muted group-hover:text-citro-orange transition-colors shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-primary">
                                {topic.label}
                              </p>
                              <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                                {topic.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-xs text-text-secondary">
                    Subject <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="subject"
                    placeholder="What's this about?"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      if (formErrors.subject) {
                        setFormErrors((prev) => ({ ...prev, subject: undefined }));
                      }
                    }}
                    className={cn(formErrors.subject && "border-error")}
                  />
                  {formErrors.subject && (
                    <p className="text-xs text-error" role="alert">
                      {formErrors.subject}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="body" className="text-xs text-text-secondary">
                      Message <span className="text-error">*</span>
                    </Label>
                    <span
                      className={cn(
                        "text-[10px] font-mono tabular-nums",
                        body.length > BODY_MAX_LENGTH
                          ? "text-error"
                          : body.length > BODY_MAX_LENGTH * 0.9
                            ? "text-amber-500"
                            : "text-text-muted"
                      )}
                    >
                      {body.length}/{BODY_MAX_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    id="body"
                    placeholder="Write your message..."
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      if (formErrors.body) {
                        setFormErrors((prev) => ({ ...prev, body: undefined }));
                      }
                    }}
                    rows={5}
                    error={!!formErrors.body}
                  />
                  {formErrors.body && (
                    <p className="text-xs text-error" role="alert">
                      {formErrors.body}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-border p-6 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={submitting}>
                  <Send className="h-4 w-4" />
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Search and Filter bar */}
        {conversations.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <Input
                placeholder="Search conversations..."
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

            {/* Status filter */}
            <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-secondary-bg/50 shrink-0">
              {(["ALL", "OPEN", "RESOLVED"] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                    statusFilter === status
                      ? "bg-card text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {status === "ALL" ? "All" : status === "OPEN" ? "Open" : "Resolved"}
                </button>
              ))}
            </div>
          </div>
        )}

        {conversations.length === 0 ? (
          /* Empty state: No conversations at all */
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
              No messages yet
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm">
              Start a conversation with the CitroTech team for support, questions, or feedback.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <MessageSquare className="h-4 w-4" />
              Start a conversation
            </Button>
          </motion.div>
        ) : filteredConversations.length === 0 ? (
          /* Empty state: No conversations match search/filter */
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-full bg-secondary-bg p-4 mb-4">
              <Search className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary font-display mb-1">
              No conversations match your search
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm">
              Try adjusting your search terms or filters to find what you are looking for.
            </p>
            {hasActiveSearch && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="space-y-3"
            variants={listContainer}
            initial="hidden"
            animate="show"
          >
            {filteredConversations.map((conversation) => (
              <motion.div key={conversation.id} variants={listItem}>
                <Link href={`/messages/${conversation.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {conversation.unreadCount > 0 && (
                              <span
                                className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-citro-orange text-white text-[10px] font-bold tabular-nums shrink-0"
                                aria-label={`${conversation.unreadCount} unread`}
                              >
                                {conversation.unreadCount > 99
                                  ? "99+"
                                  : conversation.unreadCount}
                              </span>
                            )}
                            <h3
                              className={cn(
                                "text-sm truncate",
                                conversation.unreadCount > 0
                                  ? "font-semibold text-text-primary"
                                  : "font-medium text-text-primary"
                              )}
                            >
                              {conversation.subject || "No subject"}
                            </h3>
                          </div>

                          {conversation.lastMessage && (
                            <p className="text-xs text-text-muted truncate max-w-[90%]">
                              <span className="text-text-secondary font-medium">
                                {conversation.lastMessage.senderType === "PARTNER"
                                  ? "You"
                                  : conversation.lastMessage.senderName}
                                :
                              </span>{" "}
                              {conversation.lastMessage.body.slice(0, 120)}
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
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
