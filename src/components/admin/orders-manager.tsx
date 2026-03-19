"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Calendar,
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  Truck,
  PackageCheck,
  XCircle,
  AlertTriangle,
  CreditCard,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  product: string;
  quantity: number;
}

type PaymentStatus = "PENDING" | "INVOICED" | "PAID";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  projectName: string | null;
  submittedAt: string;
  createdAt: string;
  paymentStatus: PaymentStatus | null;
  partner: { firstName: string; lastName: string; companyName: string };
  items: OrderItem[];
}

interface OrdersManagerProps {
  orders: Order[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const PRODUCT_LABELS: Record<string, string> = {
  MFB_31: "MFB-31",
  MFB_34: "MFB-34",
};

const STATUS_TABS = [
  "ALL",
  "SUBMITTED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-status-submitted/15 text-status-submitted",
  CONFIRMED: "bg-status-confirmed/15 text-status-confirmed",
  PROCESSING: "bg-status-processing/15 text-status-processing",
  SHIPPED: "bg-status-shipped/15 text-status-shipped",
  DELIVERED: "bg-status-delivered/15 text-status-delivered",
  CANCELLED: "bg-status-cancelled/15 text-status-cancelled",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["CANCELLED"],
  CANCELLED: [],
};

const paymentStatusColors: Record<PaymentStatus, string> = {
  PENDING: "bg-warning/15 text-warning",
  INVOICED: "bg-info/15 text-info",
  PAID: "bg-success/15 text-success",
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  INVOICED: "Invoiced",
  PAID: "Paid",
};

function isAwaitingReview(order: Order): boolean {
  if (order.status !== "SUBMITTED") return false;
  const submittedAt = new Date(order.submittedAt).getTime();
  const now = Date.now();
  return now - submittedAt > 24 * 60 * 60 * 1000;
}

const STATUS_ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; destructive?: boolean }
> = {
  CONFIRMED: { label: "Confirm", icon: CheckCircle2 },
  PROCESSING: { label: "Process", icon: Loader2 },
  SHIPPED: { label: "Ship", icon: Truck },
  DELIVERED: { label: "Deliver", icon: PackageCheck },
  CANCELLED: { label: "Cancel", icon: XCircle, destructive: true },
};

/* ------------------------------------------------------------------ */
/*  Mini status flow                                                   */
/* ------------------------------------------------------------------ */

const STATUS_FLOW = [
  "SUBMITTED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];
const STATUS_INDEX: Record<string, number> = {};
STATUS_FLOW.forEach((s, i) => (STATUS_INDEX[s] = i));

function MiniStatusDots({ status }: { status: string }) {
  const idx = STATUS_INDEX[status] ?? -1;
  if (status === "CANCELLED") {
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
      {STATUS_FLOW.map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full",
            i === 0 ? "w-4" : "w-3",
            i <= idx
              ? i === idx
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
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Confirmation Dialog                                                */
/* ------------------------------------------------------------------ */

interface StatusChangeConfirmation {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  newStatus: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrdersManager({ orders }: OrdersManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmation, setConfirmation] =
    useState<StatusChangeConfirmation | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [confirming, setConfirming] = useState(false);

  const filtered = useMemo(() => {
    if (activeTab === "ALL") return orders;
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const openConfirmation = useCallback(
    (order: Order, newStatus: string) => {
      setConfirmation({
        orderId: order.id,
        orderNumber: order.orderNumber,
        currentStatus: order.status,
        newStatus,
      });
      setTrackingNumber("");
    },
    []
  );

  const handleConfirmedStatusUpdate = useCallback(async () => {
    if (!confirmation) return;

    setConfirming(true);
    try {
      if (confirmation.newStatus === "SHIPPED" && !trackingNumber.trim()) {
        toast.error("Tracking number is required when shipping an order");
        setConfirming(false);
        return;
      }
      const body: Record<string, unknown> = {
        status: confirmation.newStatus,
      };
      // Include tracking number when shipping
      if (confirmation.newStatus === "SHIPPED" && trackingNumber.trim()) {
        body.trackingNumber = trackingNumber.trim();
      }

      const res = await fetch(`/api/orders/${confirmation.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      toast.success(
        `Order ${confirmation.orderNumber} updated to ${confirmation.newStatus.toLowerCase()}`
      );
      setConfirmation(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setConfirming(false);
    }
  }, [confirmation, trackingNumber, router]);

  const isDestructive = confirmation?.newStatus === "CANCELLED";
  const isShipping = confirmation?.newStatus === "SHIPPED";

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Orders"
          description={`${orders.length} total orders`}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="overflow-x-auto flex-nowrap">
            {STATUS_TABS.map((tab) => {
              const count =
                tab === "ALL"
                  ? orders.length
                  : orders.filter((o) => o.status === tab).length;
              return (
                <TabsTrigger key={tab} value={tab}>
                  {tab === "ALL"
                    ? "All"
                    : tab.charAt(0) + tab.slice(1).toLowerCase()}
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

        {/* Table - Desktop */}
        <div className="hidden md:block">
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left font-medium text-text-secondary px-4 py-3">
                      Order #
                    </th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">
                      Partner
                    </th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">
                      Company
                    </th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">
                      Status
                    </th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">
                      Items
                    </th>
                    <th className="text-left font-medium text-text-secondary px-4 py-3">
                      Date
                    </th>
                    <th className="text-right font-medium text-text-secondary px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const allowedTransitions =
                      VALID_TRANSITIONS[order.status] ?? [];

                    return (
                      <tr
                        key={order.id}
                        className="border-b border-border last:border-b-0 hover:bg-secondary-bg transition-colors group cursor-pointer"
                        onClick={() =>
                          router.push(`/admin/orders/${order.id}`)
                        }
                      >
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className="font-mono font-semibold text-text-primary">
                              {order.orderNumber}
                            </span>
                            <MiniStatusDots status={order.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {order.partner.firstName} {order.partner.lastName}
                        </td>
                        <td className="px-4 py-3 text-text-muted">
                          {order.partner.companyName}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                statusColors[order.status] ??
                                  "bg-secondary-bg text-text-secondary"
                              )}
                            >
                              {order.status === "CANCELLED"
                                ? "Cancelled"
                                : order.status.charAt(0) +
                                  order.status.slice(1).toLowerCase()}
                            </span>
                            {order.paymentStatus && (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                  paymentStatusColors[order.paymentStatus]
                                )}
                              >
                                <CreditCard className="h-2.5 w-2.5" />
                                {paymentStatusLabels[order.paymentStatus]}
                              </span>
                            )}
                            {isAwaitingReview(order) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning">
                                <Clock className="h-2.5 w-2.5" />
                                Awaiting review
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">
                          {order.items
                            .map(
                              (item) =>
                                `${
                                  PRODUCT_LABELS[item.product] ?? item.product
                                } x${item.quantity}`
                            )
                            .join(", ")}
                        </td>
                        <td className="px-4 py-3 text-text-muted text-xs">
                          {formatDate(order.createdAt)}
                        </td>
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end">
                            {allowedTransitions.length > 0 ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className="p-1.5 rounded-md hover:bg-card text-text-muted hover:text-text-primary transition-colors"
                                  aria-label="Order actions"
                                >
                                  {updatingId === order.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {allowedTransitions.map((newStatus) => {
                                    const config =
                                      STATUS_ACTION_CONFIG[newStatus];
                                    if (!config) return null;
                                    const Icon = config.icon;
                                    const isCancelAction = config.destructive;

                                    return (
                                      <React.Fragment key={newStatus}>
                                        {isCancelAction && (
                                          <DropdownMenuSeparator />
                                        )}
                                        <DropdownMenuItem
                                          onClick={() =>
                                            openConfirmation(order, newStatus)
                                          }
                                          className={cn(
                                            isCancelAction &&
                                              "text-red-500 focus:text-red-500"
                                          )}
                                        >
                                          <Icon className="h-4 w-4 mr-2" />
                                          {config.label}
                                        </DropdownMenuItem>
                                      </React.Fragment>
                                    );
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-text-muted">--</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-text-muted"
                      >
                        No orders found.
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
          {filtered.map((order) => (
            <motion.div key={order.id} variants={listItem}>
              <Link href={`/admin/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold text-text-primary">
                            {order.orderNumber}
                          </span>
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
                          {order.paymentStatus && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                                paymentStatusColors[order.paymentStatus]
                              )}
                            >
                              <CreditCard className="h-2.5 w-2.5" />
                              {paymentStatusLabels[order.paymentStatus]}
                            </span>
                          )}
                          {isAwaitingReview(order) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning">
                              <Clock className="h-2.5 w-2.5" />
                              Awaiting review
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary">
                          {order.partner.companyName} --{" "}
                          {order.partner.firstName} {order.partner.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </span>
                          <span>
                            {order.items
                              .map(
                                (item) =>
                                  `${
                                    PRODUCT_LABELS[item.product] ?? item.product
                                  } x${item.quantity}`
                              )
                              .join(", ")}
                          </span>
                        </div>
                        <MiniStatusDots status={order.status} />
                      </div>
                      <ChevronRight className="h-5 w-5 text-text-muted group-hover:text-text-secondary transition-colors shrink-0 mt-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-text-muted text-center py-12">
              No orders found.
            </p>
          )}
        </motion.div>

        {/* Confirmation Dialog */}
        <Dialog
          open={!!confirmation}
          onOpenChange={(open) => {
            if (!open) setConfirmation(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle
                className={cn(
                  "flex items-center gap-2",
                  isDestructive && "text-error"
                )}
              >
                {isDestructive ? (
                  <AlertTriangle className="h-5 w-5 text-error" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-citro-orange" />
                )}
                {isDestructive
                  ? "Cancel Order?"
                  : `Update to ${
                      confirmation?.newStatus
                        ? confirmation.newStatus.charAt(0) +
                          confirmation.newStatus.slice(1).toLowerCase()
                        : ""
                    }?`}
              </DialogTitle>
              <DialogDescription>
                {isDestructive
                  ? `Are you sure you want to cancel order ${confirmation?.orderNumber}? This action cannot be undone.`
                  : `Change order ${confirmation?.orderNumber} from ${
                      confirmation?.currentStatus
                        ? confirmation.currentStatus.charAt(0) +
                          confirmation.currentStatus.slice(1).toLowerCase()
                        : ""
                    } to ${
                      confirmation?.newStatus
                        ? confirmation.newStatus.charAt(0) +
                          confirmation.newStatus.slice(1).toLowerCase()
                        : ""
                    }. The partner will be notified via email.`}
              </DialogDescription>
            </DialogHeader>

            {/* Visual status flow */}
            {confirmation && !isDestructive && (
              <div className="px-6 py-3">
                <div className="flex items-center justify-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      statusColors[confirmation.currentStatus]
                    )}
                  >
                    {confirmation.currentStatus.charAt(0) +
                      confirmation.currentStatus.slice(1).toLowerCase()}
                  </span>
                  <div className="flex items-center gap-1 text-text-muted">
                    <div className="w-8 h-0.5 bg-border" />
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      statusColors[confirmation.newStatus]
                    )}
                  >
                    {confirmation.newStatus.charAt(0) +
                      confirmation.newStatus.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Tracking number field for SHIPPED - required */}
            {isShipping && (
              <div className="px-6 space-y-2">
                <Label
                  htmlFor="tracking-number"
                  className="text-xs text-text-secondary"
                >
                  Tracking Number
                  <span className="text-error ml-1">*</span>
                </Label>
                <Input
                  id="tracking-number"
                  placeholder="Enter tracking number..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                />
                <p className="text-[10px] text-text-muted">
                  Partner will be notified with tracking info.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmation(null)}
                disabled={confirming}
              >
                Cancel
              </Button>
              <Button
                variant={isDestructive ? "destructive" : "default"}
                size="sm"
                onClick={handleConfirmedStatusUpdate}
                loading={confirming}
                disabled={
                  confirming || (isShipping && !trackingNumber.trim())
                }
              >
                {isDestructive
                  ? "Yes, Cancel Order"
                  : `Update to ${
                      confirmation?.newStatus
                        ? confirmation.newStatus.charAt(0) +
                          confirmation.newStatus.slice(1).toLowerCase()
                        : ""
                    }`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
