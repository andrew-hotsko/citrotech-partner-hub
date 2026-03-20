"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  MapPin,
  Shield,
  Calendar,
  Loader2,
  AlertTriangle,
  Ban,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { updatePartner } from "@/app/(admin)/admin/partners/[id]/actions";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  product: string;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  projectName: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface ConversationMessage {
  body: string;
  senderType: string;
  senderName: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  subject: string | null;
  status: string;
  lastMessageAt: string;
  messages: ConversationMessage[];
}

interface PartnerData {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contractorLicense: string | null;
  insuranceExpiry: string | null;
  tier: "REGISTERED" | "CERTIFIED" | "PREMIER";
  certifiedAt: string | null;
  certExpiresAt: string | null;
  certificationNotes: string | null;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  orders: Order[];
  conversations: Conversation[];
}

interface PartnerDetailProps {
  partner: PartnerData;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const tierConfig: Record<
  PartnerData["tier"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  CERTIFIED: { label: "Certified", variant: "default" },
  PREMIER: { label: "Premier", variant: "secondary" },
  REGISTERED: { label: "Registered", variant: "outline" },
};

const statusConfig: Record<PartnerData["status"], { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-emerald-500/15 text-emerald-600" },
  SUSPENDED: { label: "Suspended", className: "bg-amber-500/15 text-amber-600" },
  INACTIVE: { label: "Inactive", className: "bg-red-500/15 text-red-600" },
};

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-status-submitted/15 text-status-submitted",
  CONFIRMED: "bg-status-confirmed/15 text-status-confirmed",
  PROCESSING: "bg-status-processing/15 text-status-processing",
  SHIPPED: "bg-status-shipped/15 text-status-shipped",
  DELIVERED: "bg-status-delivered/15 text-status-delivered",
  CANCELLED: "bg-status-cancelled/15 text-status-cancelled",
};

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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PartnerDetail({ partner }: PartnerDetailProps) {
  const router = useRouter();
  const [tier, setTier] = useState(partner.tier);
  const [status, setStatus] = useState(partner.status);
  const [certNotes, setCertNotes] = useState(partner.certificationNotes ?? "");
  const [saving, setSaving] = useState(false);

  // Danger zone state
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const hasChanges =
    tier !== partner.tier ||
    status !== partner.status ||
    certNotes !== (partner.certificationNotes ?? "");

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const result = await updatePartner({
        id: partner.id,
        tier,
        status,
        certificationNotes: certNotes,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Partner updated successfully");
      }
    } catch {
      toast.error("Failed to update partner");
    } finally {
      setSaving(false);
    }
  }, [partner.id, tier, status, certNotes]);

  const isActive = partner.status === "ACTIVE";

  const handleDeactivateToggle = useCallback(async () => {
    setDeactivating(true);
    const newStatus = isActive ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update partner status.");
        return;
      }
      toast.success(
        newStatus === "INACTIVE"
          ? "Partner has been deactivated."
          : "Partner has been reactivated."
      );
      setDeactivateOpen(false);
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeactivating(false);
    }
  }, [partner.id, isActive, router]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete partner.");
        return;
      }
      toast.success("Partner has been permanently deleted.");
      setDeleteOpen(false);
      router.push("/admin/partners");
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  }, [partner.id, router]);

  const tierInfo = tierConfig[tier];
  const statusInfo = statusConfig[status];

  return (
    <PageTransition>
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Back link */}
        <motion.div variants={itemVariants}>
          <Link
            href="/admin/partners"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Partners
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display text-text-primary tracking-tight">
                {partner.firstName} {partner.lastName}
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">{partner.companyName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={tierInfo.variant}>{tierInfo.label}</Badge>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusInfo.className
                )}
              >
                {statusInfo.label}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Partner Info */}
          <motion.div className="lg:col-span-2 space-y-6" variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-forest-teal shrink-0" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-text-muted text-xs flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </dt>
                    <dd className="text-text-primary mt-0.5">{partner.email}</dd>
                  </div>
                  {partner.phone && (
                    <div>
                      <dt className="text-text-muted text-xs flex items-center gap-1">
                        <Phone className="h-3 w-3" /> Phone
                      </dt>
                      <dd className="text-text-primary mt-0.5">{partner.phone}</dd>
                    </div>
                  )}
                  {(partner.address || partner.city) && (
                    <div className="sm:col-span-2">
                      <dt className="text-text-muted text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Address
                      </dt>
                      <dd className="text-text-primary mt-0.5">
                        {[partner.address, partner.city, partner.state, partner.zip]
                          .filter(Boolean)
                          .join(", ")}
                      </dd>
                    </div>
                  )}
                  {partner.contractorLicense && (
                    <div>
                      <dt className="text-text-muted text-xs flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Contractor License
                      </dt>
                      <dd className="text-text-primary mt-0.5">{partner.contractorLicense}</dd>
                    </div>
                  )}
                  {partner.insuranceExpiry && (
                    <div>
                      <dt className="text-text-muted text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Insurance Expiry
                      </dt>
                      <dd className="text-text-primary mt-0.5">{formatDate(partner.insuranceExpiry)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-text-muted text-xs">Member Since</dt>
                    <dd className="text-text-primary mt-0.5">{formatDate(partner.createdAt)}</dd>
                  </div>
                  {partner.certifiedAt && (
                    <div>
                      <dt className="text-text-muted text-xs">Certified At</dt>
                      <dd className="text-text-primary mt-0.5">{formatDate(partner.certifiedAt)}</dd>
                    </div>
                  )}
                  {partner.certExpiresAt && (
                    <div>
                      <dt className="text-text-muted text-xs">Certification Expires</dt>
                      <dd className="text-text-primary mt-0.5">{formatDate(partner.certExpiresAt)}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {partner.orders.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {partner.orders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-bg transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-sm font-mono font-medium text-text-primary">
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
                          {order.projectName && (
                            <span className="text-xs text-text-muted truncate hidden sm:inline">
                              {order.projectName}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-text-muted">{formatDate(order.createdAt)}</span>
                          <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Conversations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                {partner.conversations.length === 0 ? (
                  <p className="text-sm text-text-muted text-center py-6">No conversations yet</p>
                ) : (
                  <div className="space-y-2">
                    {partner.conversations.map((conv) => (
                      <Link
                        key={conv.id}
                        href={`/admin/messages/${conv.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary-bg transition-colors group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {conv.subject || "No subject"}
                          </p>
                          {conv.messages[0] && (
                            <p className="text-xs text-text-muted truncate mt-0.5">
                              {conv.messages[0].body.slice(0, 80)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs text-text-muted">
                            {formatRelativeTime(conv.lastMessageAt)}
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

          {/* Admin Controls Sidebar */}
          <motion.div className="space-y-6" variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="tier" className="text-xs text-text-secondary">
                    Partner Tier
                  </Label>
                  <Select
                    id="tier"
                    value={tier}
                    onChange={(e) => setTier(e.target.value as PartnerData["tier"])}
                  >
                    <option value="REGISTERED">Registered</option>
                    <option value="CERTIFIED">Certified</option>
                    <option value="PREMIER">Premier</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs text-text-secondary">
                    Status
                  </Label>
                  <Select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PartnerData["status"])}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="INACTIVE">Inactive</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cert-notes" className="text-xs text-text-secondary">
                    Certification Notes
                  </Label>
                  <Textarea
                    id="cert-notes"
                    placeholder="Add notes about this partner's certification..."
                    value={certNotes}
                    onChange={(e) => setCertNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  loading={saving}
                  disabled={!hasChanges || saving}
                  fullWidth
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants}>
          <Card className="border-red-300 dark:border-red-500/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Deactivate / Reactivate */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {isActive ? "Deactivate Partner" : "Reactivate Partner"}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isActive
                      ? "The partner will be banned from signing in and their account will be marked as inactive."
                      : "The partner will be unbanned and able to sign in again."}
                  </p>
                </div>
                <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
                  <Button
                    variant={isActive ? "outline" : "outline"}
                    size="sm"
                    className={cn(
                      "shrink-0",
                      isActive
                        ? "border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                        : "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    )}
                    onClick={() => setDeactivateOpen(true)}
                  >
                    {isActive ? (
                      <>
                        <Ban className="h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Reactivate
                      </>
                    )}
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {isActive ? "Deactivate Partner" : "Reactivate Partner"}
                      </DialogTitle>
                      <DialogDescription>
                        {isActive
                          ? `Are you sure you want to deactivate ${partner.firstName} ${partner.lastName}? They will be banned from signing in and will not be able to access the partner portal.`
                          : `Are you sure you want to reactivate ${partner.firstName} ${partner.lastName}? They will be unbanned and able to sign in again.`}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeactivateOpen(false)}
                        disabled={deactivating}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant={isActive ? "destructive" : "secondary"}
                        size="sm"
                        onClick={handleDeactivateToggle}
                        loading={deactivating}
                        disabled={deactivating}
                      >
                        {isActive ? "Deactivate" : "Reactivate"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Delete */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-red-300 dark:border-red-500/30">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary">Delete Partner</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Permanently delete this partner and all their data including orders,
                    conversations, and messages. This action cannot be undone.
                  </p>
                </div>
                <Dialog
                  open={deleteOpen}
                  onOpenChange={(open) => {
                    setDeleteOpen(open);
                    if (!open) setDeleteConfirmText("");
                  }}
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Partner
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Partner Permanently</DialogTitle>
                      <DialogDescription>
                        This will permanently delete{" "}
                        <strong>
                          {partner.firstName} {partner.lastName}
                        </strong>{" "}
                        and all associated data including orders, conversations, and
                        messages. The user will also be removed from Clerk. This action
                        cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 pb-2 space-y-2">
                      <Label htmlFor="delete-confirm" className="text-xs text-text-secondary">
                        Type <span className="font-mono font-semibold text-text-primary">{partner.email}</span> to confirm
                      </Label>
                      <Input
                        id="delete-confirm"
                        placeholder={partner.email}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        error={
                          deleteConfirmText.length > 0 &&
                          deleteConfirmText !== partner.email
                        }
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDeleteOpen(false);
                          setDeleteConfirmText("");
                        }}
                        disabled={deleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        loading={deleting}
                        disabled={deleting || deleteConfirmText !== partner.email}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Forever
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </PageTransition>
  );
}
