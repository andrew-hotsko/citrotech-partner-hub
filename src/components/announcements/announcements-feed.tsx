"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Bell, Pin, Calendar, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type AnnouncementType = "INFO" | "PRODUCT" | "TRAINING" | "URGENT" | "FIELD_NOTE";

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  isPinned: boolean;
  authorName: string;
  publishedAt: string;
}

interface AnnouncementsFeedProps {
  announcements: Announcement[];
}

/* ------------------------------------------------------------------ */
/*  Color maps                                                         */
/* ------------------------------------------------------------------ */

const borderColorMap: Record<AnnouncementType, string> = {
  INFO: "#2563EB",
  PRODUCT: "#105D50",
  TRAINING: "#F78E25",
  URGENT: "#DC2626",
  FIELD_NOTE: "#105D50",
};

const badgeClassMap: Record<AnnouncementType, string> = {
  INFO: "bg-blue-500/15 text-blue-600",
  PRODUCT: "bg-forest-teal/15 text-forest-teal",
  TRAINING: "bg-citro-orange/15 text-citro-orange",
  URGENT: "bg-red-500/15 text-red-600",
  FIELD_NOTE: "bg-forest-teal/15 text-forest-teal",
};

/* ------------------------------------------------------------------ */
/*  Filter options                                                     */
/* ------------------------------------------------------------------ */

const typeFilters: { value: AnnouncementType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PRODUCT", label: "Product" },
  { value: "TRAINING", label: "Training" },
  { value: "URGENT", label: "Urgent" },
  { value: "INFO", label: "Info" },
  { value: "FIELD_NOTE", label: "Field Note" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isRecentAnnouncement(publishedAt: string): boolean {
  const publishDate = new Date(publishedAt);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return publishDate >= sevenDaysAgo;
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AnnouncementsFeed({ announcements }: AnnouncementsFeedProps) {
  const [activeFilter, setActiveFilter] = useState<AnnouncementType | "ALL">("ALL");

  const filtered = useMemo(() => {
    if (activeFilter === "ALL") return announcements;
    return announcements.filter((a) => a.type === activeFilter);
  }, [announcements, activeFilter]);

  // Separate recent vs older for visual distinction
  const recentAnnouncements = filtered.filter((a) => isRecentAnnouncement(a.publishedAt));
  const olderAnnouncements = filtered.filter((a) => !isRecentAnnouncement(a.publishedAt));

  if (announcements.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Announcements"
          description="Stay updated with the latest from CitroTech"
        />
        <motion.div
          className="flex flex-col items-center justify-center py-20 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="rounded-full bg-secondary-bg p-4 mb-4">
            <Megaphone className="h-8 w-8 text-text-muted" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary font-display">
            No announcements yet
          </h3>
          <p className="mt-1 text-sm text-text-secondary max-w-sm">
            There are no announcements to display at this time. New product updates,
            training schedules, and important notices will appear here.
          </p>
          <p className="mt-3 text-xs text-text-muted">
            Check back later or visit the{" "}
            <a href="/support" className="text-citro-orange hover:underline">
              Support page
            </a>{" "}
            if you have questions.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Stay updated with the latest from CitroTech"
      />

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map((filter) => {
          const isActive = activeFilter === filter.value;
          const count =
            filter.value === "ALL"
              ? announcements.length
              : announcements.filter((a) => a.type === filter.value).length;

          if (filter.value !== "ALL" && count === 0) return null;

          return (
            <Button
              key={filter.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "gap-1.5",
                !isActive && "text-text-secondary"
              )}
            >
              {filter.label}
              <Badge
                variant="outline"
                className={cn(
                  "ml-0.5 text-[10px] px-1.5 py-0",
                  isActive && "border-white/30 text-white"
                )}
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Filtered empty state */}
      {filtered.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="rounded-full bg-secondary-bg p-3 mb-3">
            <Bell className="h-6 w-6 text-text-muted" aria-hidden="true" />
          </div>
          <p className="text-sm text-text-muted">
            No {activeFilter.toLowerCase()} announcements to display.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-text-secondary"
            onClick={() => setActiveFilter("ALL")}
          >
            Show all announcements
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className="space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Recent announcements section */}
          {recentAnnouncements.length > 0 && (
            <div className="space-y-3">
              {olderAnnouncements.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                    Recent
                  </h2>
                </div>
              )}
              {recentAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isRecent
                />
              ))}
            </div>
          )}

          {/* Older announcements section */}
          {olderAnnouncements.length > 0 && (
            <div className="space-y-3">
              {recentAnnouncements.length > 0 && (
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider pt-2">
                  Earlier
                </h2>
              )}
              {olderAnnouncements.map((announcement) => (
                <AnnouncementCard
                  key={announcement.id}
                  announcement={announcement}
                  isRecent={false}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Announcement Card                                                  */
/* ------------------------------------------------------------------ */

function AnnouncementCard({
  announcement,
  isRecent,
}: {
  announcement: Announcement;
  isRecent: boolean;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card
        className={cn(
          "border-l-4 overflow-hidden",
          isRecent && "ring-1 ring-green-500/20 bg-green-500/[0.02]"
        )}
        style={{ borderLeftColor: borderColorMap[announcement.type] }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
              <Badge className={cn("text-xs", badgeClassMap[announcement.type])}>
                {announcement.type}
              </Badge>
              {announcement.isPinned && (
                <Badge variant="outline" className="gap-1">
                  <Pin className="h-3 w-3" aria-hidden="true" />
                  Pinned
                </Badge>
              )}
              {isRecent && (
                <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600 text-[10px]">
                  New
                </Badge>
              )}
            </div>
            {/* Prominent date */}
            <span className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <time
                dateTime={announcement.publishedAt}
                title={formatDate(announcement.publishedAt)}
              >
                {formatDate(announcement.publishedAt)}
              </time>
            </span>
          </div>
          <h3 className="text-base font-semibold text-text-primary font-display mt-1">
            {announcement.title}
          </h3>
        </CardHeader>

        <CardContent>
          <div className="prose prose-sm max-w-none text-text-secondary [&_a]:text-citro-orange [&_a]:underline [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
              {announcement.body}
            </ReactMarkdown>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 text-xs text-text-muted">
            <span>By {announcement.authorName}</span>
            <span aria-hidden="true">&middot;</span>
            <time
              dateTime={announcement.publishedAt}
              title={formatDate(announcement.publishedAt)}
            >
              {formatRelativeTime(announcement.publishedAt)}
            </time>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
