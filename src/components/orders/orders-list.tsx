"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  ChevronRight,
  Calendar,
  Search,
  Copy,
  Check,
  Package,
  X,
  FilterX,
  ClipboardList,
  CheckCircle2,
  Loader2,
  Truck,
  PackageCheck,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { NewOrderDialog } from "./new-order-dialog";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  product: "MFB_31" | "MFB_34";
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  projectName: string | null;
  submittedAt: string;
  items: OrderItem[];
}

interface OrdersListProps {
  orders: Order[];
  warehouseAddress?: string;
}

/* ------------------------------------------------------------------ */
/*  Product display helpers                                            */
/* ------------------------------------------------------------------ */

const PRODUCT_LABELS: Record<string, string> = {
  MFB_31: "MFB-31",
  MFB_34: "MFB-34",
};

function formatItemSummary(items: OrderItem[]): string {
  return items
    .map(
      (item) =>
        `${PRODUCT_LABELS[item.product] ?? item.product} x${item.quantity}`
    )
    .join(", ");
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const DATE_RANGE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
  { value: "year", label: "This Year" },
];

/* ------------------------------------------------------------------ */
/*  Status progress indicator                                          */
/* ------------------------------------------------------------------ */

type StatusKey =
  | "submitted"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered";

interface StatusStepConfig {
  key: StatusKey;
  icon: LucideIcon;
}

const STATUS_STEPS: StatusStepConfig[] = [
  { key: "submitted", icon: ClipboardList },
  { key: "confirmed", icon: CheckCircle2 },
  { key: "processing", icon: Loader2 },
  { key: "shipped", icon: Truck },
  { key: "delivered", icon: PackageCheck },
];

const STATUS_ORDER_MAP: Record<string, number> = {
  SUBMITTED: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

function MiniStatusProgress({ status }: { status: string }) {
  const currentIdx = STATUS_ORDER_MAP[status] ?? -1;
  const isCancelled = status === "CANCELLED";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-1">
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--status-cancelled)]" />
        <span className="text-[10px] text-[var(--status-cancelled)] font-medium">
          Cancelled
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {STATUS_STEPS.map((step, idx) => (
        <div
          key={step.key}
          className={cn(
            "h-1 rounded-full transition-colors duration-300",
            idx === 0 ? "w-4" : "w-3",
            idx <= currentIdx
              ? idx === currentIdx
                ? "bg-citro-orange"
                : "bg-[var(--status-delivered)]"
              : "bg-border"
          )}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Copy to Clipboard Button                                           */
/* ------------------------------------------------------------------ */

function CopyOrderNumber({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard.writeText(orderNumber).then(() => {
        setCopied(true);
        toast.success("Copied!", { duration: 1500 });
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [orderNumber]
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center h-6 w-6 rounded-md text-text-muted hover:text-text-primary hover:bg-secondary-bg transition-colors duration-150 shrink-0"
      title="Copy order number"
      aria-label={`Copy order number ${orderNumber}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[var(--status-delivered)]" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrdersList({ orders, warehouseAddress }: OrdersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<{
    mfb31Qty?: number;
    mfb34Qty?: number;
    projectName?: string;
    projectAddress?: string;
  } | undefined>(undefined);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");

  // Pre-fill from URL params (for reorder)
  useEffect(() => {
    const reorder = searchParams.get("reorder");
    if (reorder === "true") {
      const mfb31 = searchParams.get("mfb31");
      const mfb34 = searchParams.get("mfb34");
      const pName = searchParams.get("projectName");
      const pAddress = searchParams.get("projectAddress");

      const newPrefill: typeof prefill = {};
      if (mfb31) newPrefill.mfb31Qty = parseInt(mfb31) || 1;
      if (mfb34) newPrefill.mfb34Qty = parseInt(mfb34) || 1;
      if (pName) newPrefill.projectName = pName;
      if (pAddress) newPrefill.projectAddress = pAddress;

      setPrefill(newPrefill);
      setDialogOpen(true);

      // Clean URL params after pre-filling
      router.replace("/orders", { scroll: false });
    }
  }, [searchParams, router]);

  /* ---- Filtering ---- */

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(q) ||
          (order.projectName && order.projectName.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
    }

    // Date range filter
    if (dateRangeFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      if (dateRangeFilter === "year") {
        cutoff = new Date(now.getFullYear(), 0, 1);
      } else {
        const days = parseInt(dateRangeFilter);
        cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }
      result = result.filter(
        (order) => new Date(order.submittedAt) >= cutoff
      );
    }

    return result;
  }, [orders, searchQuery, statusFilter, dateRangeFilter]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "all" ||
    dateRangeFilter !== "all";

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateRangeFilter("all");
  }, []);

  const handleOpenDialog = useCallback(() => {
    setPrefill(undefined);
    setDialogOpen(true);
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Orders"
          description="View and manage your product orders."
        >
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4" />
            Place New Order
          </Button>
        </PageHeader>

        {/* New Order Dialog */}
        <NewOrderDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setPrefill(undefined);
          }}
          warehouseAddress={warehouseAddress}
          prefill={prefill}
        />

        {/* Search and Filters - only show when there are orders */}
        {orders.length > 0 && (
          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
              <Input
                placeholder="Search by order number or project name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-secondary-bg transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-44"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>

            {/* Date Range Filter */}
            <Select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="sm:w-40"
            >
              {DATE_RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </motion.div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          /* Empty state - no orders at all */
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mb-8">
              <div className="rounded-2xl bg-gradient-to-br from-citro-orange/5 to-citro-orange/10 p-8 border border-citro-orange/10">
                <Package className="h-16 w-16 text-citro-orange/60" />
              </div>
              <motion.div
                className="absolute -bottom-2 -right-2 rounded-full bg-citro-orange p-2.5 shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                  delay: 0.2,
                }}
              >
                <ShoppingCart className="h-5 w-5 text-white" />
              </motion.div>
            </div>

            <h3 className="text-xl font-semibold text-text-primary font-display mb-2">
              Ready to place your first order?
            </h3>
            <p className="text-sm text-text-secondary mb-4 max-w-md leading-relaxed">
              Order CitroTech fire barrier products in just a few steps. Select
              your products, add project details, and submit.
            </p>

            {/* Process steps */}
            <div className="flex items-center gap-6 mb-8 text-xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-citro-orange/10 flex items-center justify-center">
                  <span className="text-citro-orange font-bold text-[10px]">
                    1
                  </span>
                </div>
                <span>Select Products</span>
              </div>
              <ArrowRight className="h-3 w-3 text-border" />
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-citro-orange/10 flex items-center justify-center">
                  <span className="text-citro-orange font-bold text-[10px]">
                    2
                  </span>
                </div>
                <span>Add Details</span>
              </div>
              <ArrowRight className="h-3 w-3 text-border" />
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 rounded-full bg-citro-orange/10 flex items-center justify-center">
                  <span className="text-citro-orange font-bold text-[10px]">
                    3
                  </span>
                </div>
                <span>Submit</span>
              </div>
            </div>

            <Button onClick={handleOpenDialog} size="lg">
              <Plus className="h-4 w-4" />
              Place Your First Order
            </Button>
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          /* Empty state - filters returned nothing */
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-2xl bg-secondary-bg p-5 mb-4">
              <FilterX className="h-8 w-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary font-display mb-1">
              No orders match your filters
            </h3>
            <p className="text-sm text-text-secondary mb-5 max-w-sm">
              Try adjusting your search query, status, or date range to find
              what you&apos;re looking for.
            </p>
            <Button variant="outline" onClick={resetFilters}>
              <FilterX className="h-4 w-4" />
              Reset Filters
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Results count when filtering */}
            {hasActiveFilters && (
              <p className="text-xs text-text-muted">
                Showing {filteredOrders.length} of {orders.length} order
                {orders.length !== 1 ? "s" : ""}
              </p>
            )}

            <motion.div
              className="space-y-3"
              variants={listContainer}
              initial="hidden"
              animate="show"
            >
              {filteredOrders.map((order) => (
                <motion.div key={order.id} variants={listItem}>
                  <Link href={`/orders/${order.id}`}>
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group hover:border-citro-orange/20">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-semibold text-text-primary">
                                {order.orderNumber}
                              </span>
                              <CopyOrderNumber
                                orderNumber={order.orderNumber}
                              />
                              <Badge
                                status={
                                  order.status.toLowerCase() as
                                    | "submitted"
                                    | "confirmed"
                                    | "processing"
                                    | "shipped"
                                    | "delivered"
                                    | "cancelled"
                                }
                              >
                                {order.status.charAt(0) +
                                  order.status.slice(1).toLowerCase()}
                              </Badge>
                            </div>

                            {order.projectName && (
                              <p className="text-sm text-text-secondary truncate">
                                {order.projectName}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-text-muted">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(order.submittedAt)}
                              </span>
                              <span className="truncate">
                                {formatItemSummary(order.items)}
                              </span>
                            </div>

                            {/* Mini status progress */}
                            <MiniStatusProgress status={order.status} />
                          </div>

                          <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-citro-orange group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </PageTransition>
  );
}
