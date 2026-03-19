"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  Bell,
  Pin,
  Pencil,
  Trash2,
  Calendar,
  Eye,
  Copy,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Announcement {
  id: string;
  title: string;
  body: string;
  type: "INFO" | "PRODUCT" | "TRAINING" | "URGENT";
  isPinned: boolean;
  authorName: string;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
}

interface AnnouncementsManagerProps {
  announcements: Announcement[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG: Record<
  Announcement["type"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; borderColor: string }
> = {
  INFO: { label: "Info", variant: "outline", borderColor: "border-l-info" },
  PRODUCT: { label: "Product", variant: "secondary", borderColor: "border-l-forest-teal" },
  TRAINING: { label: "Training", variant: "default", borderColor: "border-l-citro-orange" },
  URGENT: { label: "Urgent", variant: "destructive", borderColor: "border-l-error" },
};

/**
 * Returns expiry status:
 * - "expired": already past
 * - "expiring-soon": within 7 days
 * - "active": more than 7 days remaining
 * - null: no expiry
 */
function getExpiryStatus(
  expiresAt: string | null
): "expired" | "expiring-soon" | "active" | null {
  if (!expiresAt) return null;
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "expired";
  if (diffDays <= 7) return "expiring-soon";
  return "active";
}

function getDaysUntilExpiry(expiresAt: string): number {
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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

export function AnnouncementsManager({
  announcements,
}: AnnouncementsManagerProps) {
  const router = useRouter();

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Preview dialog (full preview before publishing)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formType, setFormType] = useState<Announcement["type"]>("INFO");
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formPublishedAt, setFormPublishedAt] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");

  // Preview tab in sheet
  const [previewTab, setPreviewTab] = useState("write");

  // Status filter tabs
  const [statusTab, setStatusTab] = useState<"ALL" | "ACTIVE" | "EXPIRED">("ALL");

  // Computed: separate active and expired
  const filteredAnnouncements = useMemo(() => {
    if (statusTab === "ALL") return announcements;
    return announcements.filter((a) => {
      const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
      return statusTab === "EXPIRED" ? isExpired : !isExpired;
    });
  }, [announcements, statusTab]);

  // Expiring soon count for badge
  const expiringSoonCount = useMemo(
    () =>
      announcements.filter(
        (a) => getExpiryStatus(a.expiresAt) === "expiring-soon"
      ).length,
    [announcements]
  );

  const resetForm = useCallback(() => {
    setFormTitle("");
    setFormBody("");
    setFormType("INFO");
    setFormIsPinned(false);
    setFormPublishedAt("");
    setFormExpiresAt("");
    setEditingId(null);
    setPreviewTab("write");
  }, []);

  const openNew = useCallback(() => {
    resetForm();
    setSheetOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormTitle(announcement.title);
    setFormBody(announcement.body);
    setFormType(announcement.type);
    setFormIsPinned(announcement.isPinned);
    setFormPublishedAt(
      new Date(announcement.publishedAt).toISOString().slice(0, 16)
    );
    setFormExpiresAt(
      announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : ""
    );
    setPreviewTab("write");
    setSheetOpen(true);
  }, []);

  const handleDuplicate = useCallback((announcement: Announcement) => {
    setEditingId(null);
    setFormTitle(`${announcement.title} (Copy)`);
    setFormBody(announcement.body);
    setFormType(announcement.type);
    setFormIsPinned(announcement.isPinned);
    setFormPublishedAt("");
    setFormExpiresAt(
      announcement.expiresAt
        ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
        : ""
    );
    setPreviewTab("write");
    setSheetOpen(true);
    toast.info("Announcement duplicated as draft");
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formTitle.trim() || !formBody.trim()) {
        toast.error("Title and body are required");
        return;
      }

      setSubmitting(true);
      try {
        const payload: Record<string, unknown> = {
          title: formTitle.trim(),
          body: formBody.trim(),
          type: formType,
          isPinned: formIsPinned,
        };

        if (editingId) {
          // PATCH
          if (formExpiresAt) {
            payload.expiresAt = new Date(formExpiresAt).toISOString();
          } else {
            payload.expiresAt = null;
          }

          const res = await fetch(`/api/announcements/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to update announcement");
          }

          toast.success("Announcement updated");
        } else {
          // POST
          if (formExpiresAt) {
            payload.expiresAt = new Date(formExpiresAt).toISOString();
          }

          const res = await fetch("/api/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || "Failed to create announcement");
          }

          toast.success("Announcement created");
        }

        setSheetOpen(false);
        resetForm();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSubmitting(false);
      }
    },
    [editingId, formTitle, formBody, formType, formIsPinned, formExpiresAt, resetForm, router]
  );

  const handleDelete = useCallback(async () => {
    if (!deletingAnnouncement) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/announcements/${deletingAnnouncement.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete announcement");
      toast.success("Announcement deleted");
      setDeleteDialogOpen(false);
      setDeletingAnnouncement(null);
      router.refresh();
    } catch {
      toast.error("Failed to delete announcement");
    } finally {
      setSubmitting(false);
    }
  }, [deletingAnnouncement, router]);

  // Open full-screen preview of the current form content
  const openPreviewDialog = useCallback(() => {
    if (!formTitle.trim() || !formBody.trim()) {
      toast.error("Add a title and body before previewing");
      return;
    }
    setPreviewDialogOpen(true);
  }, [formTitle, formBody]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Announcements"
          description={`${announcements.length} announcements${expiringSoonCount > 0 ? ` -- ${expiringSoonCount} expiring soon` : ""}`}
        >
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            New Announcement
          </Button>
        </PageHeader>

        {/* Status filter tabs */}
        {announcements.length > 0 && (
          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-secondary-bg/50 w-fit">
            {(["ALL", "ACTIVE", "EXPIRED"] as const).map((tab) => {
              const count =
                tab === "ALL"
                  ? announcements.length
                  : announcements.filter((a) => {
                      const isExpired = a.expiresAt && new Date(a.expiresAt) < new Date();
                      return tab === "EXPIRED" ? isExpired : !isExpired;
                    }).length;
              return (
                <button
                  key={tab}
                  onClick={() => setStatusTab(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150",
                    statusTab === tab
                      ? "bg-card text-text-primary shadow-sm"
                      : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {tab === "ALL" ? "All" : tab === "ACTIVE" ? "Active" : "Expired"}
                  {count > 0 && (
                    <span className="ml-1.5 tabular-nums">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {filteredAnnouncements.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-full bg-secondary-bg p-4 mb-4">
              <Bell className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary font-display mb-1">
              No announcements
            </h3>
            <p className="text-sm text-text-secondary mb-6 max-w-sm">
              {statusTab !== "ALL"
                ? `No ${statusTab.toLowerCase()} announcements found.`
                : "Create your first announcement to notify partners."}
            </p>
            {statusTab === "ALL" && (
              <Button onClick={openNew}>
                <Plus className="h-4 w-4" />
                Create Announcement
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
            {filteredAnnouncements.map((announcement) => {
              const typeConfig = TYPE_CONFIG[announcement.type];
              const expiryStatus = getExpiryStatus(announcement.expiresAt);
              const isExpired = expiryStatus === "expired";
              const isExpiringSoon = expiryStatus === "expiring-soon";
              const daysLeft =
                announcement.expiresAt && !isExpired
                  ? getDaysUntilExpiry(announcement.expiresAt)
                  : null;

              return (
                <motion.div key={announcement.id} variants={listItem}>
                  <Card
                    className={cn(
                      "border-l-4 transition-all",
                      typeConfig.borderColor,
                      isExpired && "opacity-50 bg-secondary-bg/30",
                      isExpiringSoon && "ring-1 ring-amber-400/30"
                    )}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {announcement.isPinned && (
                              <Pin className="h-3.5 w-3.5 text-citro-orange shrink-0" />
                            )}
                            <h3
                              className={cn(
                                "text-sm font-semibold",
                                isExpired
                                  ? "text-text-muted line-through"
                                  : "text-text-primary"
                              )}
                            >
                              {announcement.title}
                            </h3>
                            <Badge variant={typeConfig.variant}>
                              {typeConfig.label}
                            </Badge>
                            {isExpired && (
                              <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/5">
                                Expired
                              </Badge>
                            )}
                            {isExpiringSoon && daysLeft !== null && (
                              <Badge
                                variant="outline"
                                className="text-amber-600 border-amber-500/30 bg-amber-500/5"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {daysLeft <= 0
                                  ? "Expires today"
                                  : daysLeft === 1
                                  ? "Expires tomorrow"
                                  : `${daysLeft} days left`}
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-text-muted line-clamp-2">
                            {announcement.body.replace(/[#*_~`]/g, "").slice(0, 150)}
                            {announcement.body.length > 150 ? "..." : ""}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Published {formatDate(announcement.publishedAt)}
                            </span>
                            {announcement.expiresAt && (
                              <span
                                className={cn(
                                  "flex items-center gap-1",
                                  isExpired && "text-red-500",
                                  isExpiringSoon && "text-amber-600 font-medium"
                                )}
                              >
                                <Clock className="h-3 w-3" />
                                {isExpired ? "Expired" : "Expires"}{" "}
                                {formatDate(announcement.expiresAt)}
                              </span>
                            )}
                            <span>by {announcement.authorName}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleDuplicate(announcement)}
                            className="p-1.5 rounded-md hover:bg-secondary-bg text-text-muted hover:text-text-primary transition-colors"
                            aria-label={`Duplicate ${announcement.title}`}
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(announcement)}
                            className="p-1.5 rounded-md hover:bg-secondary-bg text-text-muted hover:text-text-primary transition-colors"
                            aria-label={`Edit ${announcement.title}`}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingAnnouncement(announcement);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-1.5 rounded-md hover:bg-red-500/10 text-text-muted hover:text-red-500 transition-colors"
                            aria-label={`Delete ${announcement.title}`}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Create/Edit Sheet */}
        <Sheet
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) resetForm();
          }}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {editingId ? "Edit Announcement" : "New Announcement"}
              </SheetTitle>
              <SheetDescription>
                {editingId
                  ? "Update the announcement details."
                  : "Create a new announcement for partners."}
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="ann-title" className="text-xs text-text-secondary">
                    Title *
                  </Label>
                  <Input
                    id="ann-title"
                    placeholder="Announcement title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Body with Markdown Preview */}
                <div className="space-y-2">
                  <Label className="text-xs text-text-secondary">Body *</Label>
                  <Tabs value={previewTab} onValueChange={setPreviewTab}>
                    <TabsList>
                      <TabsTrigger value="write">Write</TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="write">
                      <Textarea
                        id="ann-body"
                        placeholder="Write your announcement in Markdown..."
                        value={formBody}
                        onChange={(e) => setFormBody(e.target.value)}
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </TabsContent>
                    <TabsContent value="preview">
                      <div className="min-h-[200px] rounded-lg border border-border bg-card p-4 prose prose-sm max-w-none text-text-primary">
                        {formBody.trim() ? (
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                            {formBody}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-text-muted italic">Nothing to preview</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ann-type" className="text-xs text-text-secondary">
                    Type
                  </Label>
                  <Select
                    id="ann-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Announcement["type"])}
                  >
                    <option value="INFO">Info</option>
                    <option value="PRODUCT">Product</option>
                    <option value="TRAINING">Training</option>
                    <option value="URGENT">Urgent</option>
                  </Select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-citro-orange focus:ring-citro-orange accent-[var(--citro-orange)]"
                  />
                  <span className="text-sm text-text-primary">Pin this announcement</span>
                </label>

                {!editingId && (
                  <div className="space-y-2">
                    <Label htmlFor="ann-published" className="text-xs text-text-secondary">
                      Publish Date (defaults to now)
                    </Label>
                    <Input
                      id="ann-published"
                      type="datetime-local"
                      value={formPublishedAt}
                      onChange={(e) => setFormPublishedAt(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="ann-expires" className="text-xs text-text-secondary">
                    Expiry Date (optional)
                  </Label>
                  <Input
                    id="ann-expires"
                    type="datetime-local"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                  />
                </div>

                {/* Preview button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={openPreviewDialog}
                  className="w-full"
                >
                  <Eye className="h-4 w-4" />
                  Preview as Partner
                </Button>
              </div>

              <SheetFooter className="border-t border-border p-6">
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={!formTitle.trim() || !formBody.trim() || submitting}
                  fullWidth
                >
                  {submitting
                    ? editingId
                      ? "Updating..."
                      : "Creating..."
                    : editingId
                    ? "Update Announcement"
                    : "Create Announcement"}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>

        {/* Full Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xs uppercase tracking-wider text-text-muted font-normal">
                Partner Preview
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 pt-2">
              {/* Simulated announcement card as partner would see it */}
              <Card
                className={cn(
                  "border-l-4",
                  TYPE_CONFIG[formType].borderColor
                )}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {formIsPinned && (
                      <Pin className="h-3.5 w-3.5 text-citro-orange shrink-0" />
                    )}
                    <h3 className="text-base font-semibold text-text-primary">
                      {formTitle || "Untitled"}
                    </h3>
                    <Badge variant={TYPE_CONFIG[formType].variant}>
                      {TYPE_CONFIG[formType].label}
                    </Badge>
                  </div>

                  <div className="prose prose-sm max-w-none text-text-primary">
                    {formBody.trim() ? (
                      <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                        {formBody}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-text-muted italic">No content yet</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-muted pt-2 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formPublishedAt
                        ? formatDate(new Date(formPublishedAt))
                        : formatDate(new Date())}
                    </span>
                    {formExpiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires {formatDate(new Date(formExpiresAt))}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Announcement</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &ldquo;{deletingAnnouncement?.title}&rdquo;? This
                action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} loading={submitting}>
                {submitting ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
