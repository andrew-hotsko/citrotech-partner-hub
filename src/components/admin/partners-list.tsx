"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  ChevronRight,
  Plus,
  UserPlus,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  tier: "REGISTERED" | "CERTIFIED" | "PREMIER";
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  certifiedAt: string | null;
  certExpiresAt?: string | null;
  createdAt: string;
  _count: { orders: number };
}

interface PartnersListProps {
  partners: Partner[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const tierConfig: Record<
  Partner["tier"],
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  CERTIFIED: { label: "Certified", variant: "default" },
  PREMIER: { label: "Premier", variant: "secondary" },
  REGISTERED: { label: "Registered", variant: "outline" },
};

const statusConfig: Record<Partner["status"], { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-emerald-500/15 text-emerald-600" },
  SUSPENDED: { label: "Suspended", className: "bg-amber-500/15 text-amber-600" },
  INACTIVE: { label: "Inactive", className: "bg-red-500/15 text-red-600" },
};

type TierFilter = "ALL" | Partner["tier"];
type StatusFilter = "ALL" | Partner["status"];

/**
 * Returns certification expiry status for color coding:
 * - "good": more than 60 days remaining
 * - "expiring": 60 days or less remaining
 * - "expired": already expired
 * - null: no expiry date
 */
function getCertExpiryStatus(
  certExpiresAt: string | null | undefined
): "good" | "expiring" | "expired" | null {
  if (!certExpiresAt) return null;
  const expiryDate = new Date(certExpiresAt);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "expired";
  if (diffDays <= 60) return "expiring";
  return "good";
}

const certExpiryColors: Record<string, string> = {
  good: "text-emerald-600",
  expiring: "text-amber-600",
  expired: "text-red-500",
};

const certExpiryBgColors: Record<string, string> = {
  good: "bg-emerald-500/10",
  expiring: "bg-amber-500/10",
  expired: "bg-red-500/10",
};

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

export function PartnersList({ partners }: PartnersListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // Create Partner dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPartner, setNewPartner] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    tier: "REGISTERED" as Partner["tier"],
  });

  const filtered = useMemo(() => {
    let result = partners;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.companyName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      );
    }

    // Tier filter
    if (tierFilter !== "ALL") {
      result = result.filter((p) => p.tier === tierFilter);
    }

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    return result;
  }, [partners, search, tierFilter, statusFilter]);

  const hasActiveFilters = search.trim() || tierFilter !== "ALL" || statusFilter !== "ALL";

  const resetCreateForm = useCallback(() => {
    setNewPartner({
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      tier: "REGISTERED",
    });
  }, []);

  const handleCreatePartner = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (
        !newPartner.firstName.trim() ||
        !newPartner.lastName.trim() ||
        !newPartner.email.trim() ||
        !newPartner.companyName.trim()
      ) {
        toast.error("All fields are required");
        return;
      }

      setCreating(true);
      try {
        const res = await fetch("/api/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: newPartner.firstName.trim(),
            lastName: newPartner.lastName.trim(),
            email: newPartner.email.trim(),
            companyName: newPartner.companyName.trim(),
            tier: newPartner.tier,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create partner");
        }

        toast.success("Partner created successfully");
        setCreateDialogOpen(false);
        resetCreateForm();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setCreating(false);
      }
    },
    [newPartner, resetCreateForm, router]
  );

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Partners"
          description={`${partners.length} total partners`}
        >
          <Button
            onClick={() => {
              resetCreateForm();
              setCreateDialogOpen(true);
            }}
          >
            <UserPlus className="h-4 w-4" />
            Create Partner
          </Button>
        </PageHeader>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search by name, company, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Tier filter */}
            <Select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as TierFilter)}
              className="w-[140px] h-10"
            >
              <option value="ALL">All Tiers</option>
              <option value="REGISTERED">Registered</option>
              <option value="CERTIFIED">Certified</option>
              <option value="PREMIER">Premier</option>
            </Select>

            {/* Status filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-[140px] h-10"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch("");
                setTierFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-xs text-citro-orange hover:text-citro-orange-dark font-medium transition-colors shrink-0 self-center"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <p className="text-xs text-text-muted">
            Showing {filtered.length} of {partners.length} partners
          </p>
        )}

        {/* Table - Desktop */}
        <div className="hidden md:block">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Name</th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Company</th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Email</th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Tier</th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Status</th>
                    <th className="text-right font-medium text-text-secondary px-4 py-3">Orders</th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">Cert. Expiry</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((partner) => {
                    const tier = tierConfig[partner.tier];
                    const status = statusConfig[partner.status];
                    const certStatus = getCertExpiryStatus(partner.certExpiresAt);
                    return (
                      <tr
                        key={partner.id}
                        className="border-b border-border last:border-b-0 hover:bg-secondary-bg transition-colors group"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/partners/${partner.id}`}
                            className="font-medium text-text-primary hover:text-citro-orange transition-colors"
                          >
                            {partner.firstName} {partner.lastName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{partner.companyName}</td>
                        <td className="px-4 py-3 text-text-muted">{partner.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant={tier.variant}>{tier.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              status.className
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                          {partner._count.orders}
                        </td>
                        <td className="px-4 py-3">
                          {partner.certExpiresAt && certStatus ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                certExpiryBgColors[certStatus],
                                certExpiryColors[certStatus]
                              )}
                            >
                              {certStatus === "expired" && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {certStatus === "expiring" && (
                                <AlertTriangle className="h-3 w-3" />
                              )}
                              {formatDate(partner.certExpiresAt)}
                              {certStatus === "expired" && " (Expired)"}
                              {certStatus === "expiring" && " (Soon)"}
                            </span>
                          ) : partner.certifiedAt ? (
                            <span className="text-text-muted text-xs">
                              {formatDate(partner.certifiedAt)}
                            </span>
                          ) : (
                            <span className="text-text-muted text-xs">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/partners/${partner.id}`}>
                            <ChevronRight className="h-4 w-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-text-muted">
                        {hasActiveFilters
                          ? "No partners found matching your filters."
                          : "No partners yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Cards - Mobile */}
        <motion.div
          className="md:hidden space-y-3"
          variants={listContainer}
          initial="hidden"
          animate="show"
        >
          {filtered.map((partner) => {
            const tier = tierConfig[partner.tier];
            const status = statusConfig[partner.status];
            const certStatus = getCertExpiryStatus(partner.certExpiresAt);
            return (
              <motion.div key={partner.id} variants={listItem}>
                <Link href={`/admin/partners/${partner.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                    <CardContent className="!p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-text-primary">
                              {partner.firstName} {partner.lastName}
                            </span>
                            <Badge variant={tier.variant}>{tier.label}</Badge>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                status.className
                              )}
                            >
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary">{partner.companyName}</p>
                          <p className="text-xs text-text-muted">{partner.email}</p>
                          <div className="flex items-center gap-4 text-xs text-text-muted flex-wrap">
                            <span>{partner._count.orders} orders</span>
                            {partner.certExpiresAt && certStatus && (
                              <span
                                className={cn(
                                  "flex items-center gap-1",
                                  certExpiryColors[certStatus]
                                )}
                              >
                                {(certStatus === "expired" || certStatus === "expiring") && (
                                  <AlertTriangle className="h-3 w-3" />
                                )}
                                Expires {formatDate(partner.certExpiresAt)}
                                {certStatus === "expired" && " (Expired)"}
                              </span>
                            )}
                            {!partner.certExpiresAt && partner.certifiedAt && (
                              <span>Certified {formatDate(partner.certifiedAt)}</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-text-secondary transition-colors shrink-0 mt-0.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-text-muted text-center py-12">
              {hasActiveFilters
                ? "No partners found matching your filters."
                : "No partners yet."}
            </p>
          )}
        </motion.div>

        {/* Create Partner Dialog */}
        <Dialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Partner</DialogTitle>
              <DialogDescription>
                Manually create a new partner account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePartner}>
              <div className="p-6 pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="cp-first" className="text-xs text-text-secondary">
                      First Name *
                    </Label>
                    <Input
                      id="cp-first"
                      placeholder="First name"
                      value={newPartner.firstName}
                      onChange={(e) =>
                        setNewPartner((p) => ({ ...p, firstName: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cp-last" className="text-xs text-text-secondary">
                      Last Name *
                    </Label>
                    <Input
                      id="cp-last"
                      placeholder="Last name"
                      value={newPartner.lastName}
                      onChange={(e) =>
                        setNewPartner((p) => ({ ...p, lastName: e.target.value }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cp-email" className="text-xs text-text-secondary">
                    Email *
                  </Label>
                  <Input
                    id="cp-email"
                    type="email"
                    placeholder="partner@company.com"
                    value={newPartner.email}
                    onChange={(e) =>
                      setNewPartner((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cp-company" className="text-xs text-text-secondary">
                    Company Name *
                  </Label>
                  <Input
                    id="cp-company"
                    placeholder="Company name"
                    value={newPartner.companyName}
                    onChange={(e) =>
                      setNewPartner((p) => ({ ...p, companyName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cp-tier" className="text-xs text-text-secondary">
                    Tier
                  </Label>
                  <Select
                    id="cp-tier"
                    value={newPartner.tier}
                    onChange={(e) =>
                      setNewPartner((p) => ({
                        ...p,
                        tier: e.target.value as Partner["tier"],
                      }))
                    }
                  >
                    <option value="REGISTERED">Registered</option>
                    <option value="CERTIFIED">Certified</option>
                    <option value="PREMIER">Premier</option>
                  </Select>
                </div>
              </div>
              <DialogFooter className="border-t border-border p-6 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={creating}>
                  <Plus className="h-4 w-4" />
                  {creating ? "Creating..." : "Create Partner"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
