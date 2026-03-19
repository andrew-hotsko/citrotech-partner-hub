"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Save,
  ClipboardList,
  CheckCircle2,
  Loader2,
  Truck,
  PackageCheck,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Building2,
  Mail,
  User,
  AlertTriangle,
  ChevronRight,
  Package,
  Leaf,
  Shield,
  CreditCard,
  Receipt,
  DollarSign,
  Home,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/format";
import { PRODUCTS, getEstimatedSubtotal, formatCurrency } from "@/lib/pricing";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItemData {
  id: string;
  product: "MFB_31" | "MFB_34";
  quantity: number;
  notes: string | null;
}

interface PartnerData {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string | null;
  tier: string;
  status: string;
}

type PaymentStatus = "PENDING" | "INVOICED" | "PAID";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  projectName: string | null;
  projectAddress: string | null;
  shippingAddress: string | null;
  estimatedInstallDate: string | null;
  partnerNotes: string | null;
  adminNotes: string | null;
  trackingNumber: string | null;
  paymentStatus: PaymentStatus | null;
  invoiceNumber: string | null;
  estimatedShipDate: string | null;
  submittedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: OrderItemData[];
  partner: PartnerData;
}

interface OrderDetailAdminProps {
  order: OrderData;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRODUCT_INFO: Record<
  string,
  {
    label: string;
    name: string;
    description: string;
    icon: LucideIcon;
    iconColor: string;
    gradient: string;
    unit: string;
  }
> = {
  MFB_31: {
    label: "MFB-31",
    name: "Vegetation Treatment",
    description:
      "Protects landscaping, brush, and ground cover from wildfire ignition",
    icon: Leaf,
    iconColor: "text-emerald-600",
    gradient: "from-emerald-500/10 to-green-500/10",
    unit: "gallons",
  },
  MFB_34: {
    label: "MFB-34",
    name: "Structural Treatment",
    description:
      "Protects decks, fences, siding, and other structures from fire",
    icon: Shield,
    iconColor: "text-blue-600",
    gradient: "from-blue-500/10 to-indigo-500/10",
    unit: "gallons",
  },
};

type StatusKey =
  | "submitted"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered";

interface TimelineStep {
  key: StatusKey;
  label: string;
  icon: LucideIcon;
}

const TIMELINE_STEPS: TimelineStep[] = [
  { key: "submitted", label: "Submitted", icon: ClipboardList },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: Loader2 },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: PackageCheck },
];

const STATUS_ORDER: Record<string, number> = {
  SUBMITTED: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["CANCELLED"],
  CANCELLED: [],
};

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-status-submitted/15 text-status-submitted",
  CONFIRMED: "bg-status-confirmed/15 text-status-confirmed",
  PROCESSING: "bg-status-processing/15 text-status-processing",
  SHIPPED: "bg-status-shipped/15 text-status-shipped",
  DELIVERED: "bg-status-delivered/15 text-status-delivered",
  CANCELLED: "bg-status-cancelled/15 text-status-cancelled",
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

function getStepDate(step: StatusKey, order: OrderData): string | null {
  switch (step) {
    case "submitted":
      return order.submittedAt;
    case "confirmed":
      return order.confirmedAt;
    case "shipped":
      return order.shippedAt;
    case "delivered":
      return order.deliveredAt;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrderDetailAdmin({ order }: OrderDetailAdminProps) {
  const router = useRouter();
  const currentIndex = STATUS_ORDER[order.status] ?? -1;
  const isCancelled = order.status === "CANCELLED";

  // Admin form state
  const [adminNotes, setAdminNotes] = useState(order.adminNotes ?? "");
  const [trackingNumber, setTrackingNumber] = useState(
    order.trackingNumber ?? ""
  );
  const [saving, setSaving] = useState(false);

  // Invoice & Payment state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    order.paymentStatus ?? "PENDING"
  );
  const [invoiceNumber, setInvoiceNumber] = useState(
    order.invoiceNumber ?? ""
  );
  const [estimatedShipDate, setEstimatedShipDate] = useState(
    order.estimatedShipDate
      ? new Date(order.estimatedShipDate).toISOString().split("T")[0]
      : ""
  );
  const [savingPayment, setSavingPayment] = useState(false);

  // Status change confirmation dialog
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [shipTrackingNumber, setShipTrackingNumber] = useState("");
  const [confirming, setConfirming] = useState(false);

  const hasNoteChanges =
    adminNotes !== (order.adminNotes ?? "") ||
    trackingNumber !== (order.trackingNumber ?? "");

  const hasPaymentChanges =
    paymentStatus !== (order.paymentStatus ?? "PENDING") ||
    invoiceNumber !== (order.invoiceNumber ?? "") ||
    estimatedShipDate !==
      (order.estimatedShipDate
        ? new Date(order.estimatedShipDate).toISOString().split("T")[0]
        : "");

  // Pricing calculation
  const estimatedPricing = useMemo(() => {
    const lineItems = order.items.map((item) => {
      const productId = item.product === "MFB_31" ? "MFB-31" : "MFB-34";
      const productInfo = PRODUCTS.find((p) => p.id === productId);
      const unitPrice = productInfo?.basePrice ?? 0;
      const lineTotal = unitPrice * item.quantity;
      return {
        product: PRODUCT_INFO[item.product]?.label ?? item.product,
        quantity: item.quantity,
        unit: PRODUCT_INFO[item.product]?.unit ?? "units",
        unitPrice,
        lineTotal,
      };
    });
    const subtotal = getEstimatedSubtotal(
      order.items.map((item) => ({
        productId: item.product === "MFB_31" ? "MFB-31" : "MFB-34",
        quantity: item.quantity,
      }))
    );
    return { lineItems, subtotal };
  }, [order.items]);

  const allowedTransitions = VALID_TRANSITIONS[order.status] ?? [];

  // Save notes/tracking only (no status change)
  const handleSaveNotes = useCallback(async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (adminNotes !== (order.adminNotes ?? ""))
        body.adminNotes = adminNotes;
      if (trackingNumber !== (order.trackingNumber ?? ""))
        body.trackingNumber = trackingNumber;

      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update order");
      }

      toast.success("Order updated successfully");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }, [
    order.id,
    order.adminNotes,
    order.trackingNumber,
    adminNotes,
    trackingNumber,
    router,
  ]);

  // Save invoice & payment fields
  const handleSavePayment = useCallback(async () => {
    setSavingPayment(true);
    try {
      const body: Record<string, unknown> = {};
      if (paymentStatus !== (order.paymentStatus ?? "PENDING"))
        body.paymentStatus = paymentStatus;
      if (invoiceNumber !== (order.invoiceNumber ?? ""))
        body.invoiceNumber = invoiceNumber;
      if (
        estimatedShipDate !==
        (order.estimatedShipDate
          ? new Date(order.estimatedShipDate).toISOString().split("T")[0]
          : "")
      )
        body.estimatedShipDate = estimatedShipDate || null;

      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update payment info");
      }

      toast.success("Payment information updated");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSavingPayment(false);
    }
  }, [
    order.id,
    order.paymentStatus,
    order.invoiceNumber,
    order.estimatedShipDate,
    paymentStatus,
    invoiceNumber,
    estimatedShipDate,
    router,
  ]);

  // Confirm status change
  const handleConfirmedStatusChange = useCallback(async () => {
    if (!pendingStatus) return;
    setConfirming(true);
    try {
      if (pendingStatus === "SHIPPED" && !shipTrackingNumber.trim()) {
        toast.error("Tracking number is required when shipping an order");
        setConfirming(false);
        return;
      }
      const body: Record<string, unknown> = { status: pendingStatus };
      if (pendingStatus === "SHIPPED" && shipTrackingNumber.trim()) {
        body.trackingNumber = shipTrackingNumber.trim();
      }

      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }

      toast.success(
        `Order updated to ${pendingStatus.charAt(0) + pendingStatus.slice(1).toLowerCase()}`
      );
      setPendingStatus(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setConfirming(false);
    }
  }, [order.id, pendingStatus, shipTrackingNumber, router]);

  const isDestructivePending = pendingStatus === "CANCELLED";
  const isShippingPending = pendingStatus === "SHIPPED";

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        {/* Order header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold font-mono text-text-primary tracking-tight">
            {order.orderNumber}
          </h1>
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
            className="text-sm px-3 py-1 w-fit"
          >
            {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
          </Badge>
        </div>

        {/* Status Timeline */}
        {!isCancelled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="hidden sm:flex items-start justify-between relative">
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
                <motion.div
                  className="absolute top-5 left-5 h-0.5"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(
                      0,
                      (currentIndex / (TIMELINE_STEPS.length - 1)) * 100
                    )}%`,
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    maxWidth: "calc(100% - 40px)",
                    backgroundColor: "var(--status-delivered)",
                  }}
                />
                {TIMELINE_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  const isFuture = idx > currentIndex;
                  const stepDate = getStepDate(step.key, order);
                  const Icon = step.icon;

                  return (
                    <motion.div
                      key={step.key}
                      className="flex flex-col items-center gap-2 relative z-10 flex-1"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.3 }}
                    >
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors",
                          isCompleted &&
                            "bg-[var(--status-delivered)] border-[var(--status-delivered)] text-white",
                          isCurrent &&
                            "border-[var(--citro-orange)] bg-citro-orange-light text-citro-orange",
                          isFuture &&
                            "border-border bg-card text-text-muted"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            isCurrent &&
                              step.key === "processing" &&
                              "animate-spin"
                          )}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium text-center",
                          isCompleted && "text-[var(--status-delivered)]",
                          isCurrent && "text-citro-orange",
                          isFuture && "text-text-muted"
                        )}
                      >
                        {step.label}
                      </span>
                      {stepDate && (
                        <span className="text-[10px] text-text-muted font-mono">
                          {formatDate(stepDate)}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Mobile: vertical */}
              <div className="sm:hidden space-y-0">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isCompleted = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  const isFuture = idx > currentIndex;
                  const stepDate = getStepDate(step.key, order);
                  const Icon = step.icon;
                  const isLast = idx === TIMELINE_STEPS.length - 1;

                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors",
                            isCompleted &&
                              "bg-[var(--status-delivered)] border-[var(--status-delivered)] text-white",
                            isCurrent &&
                              "border-[var(--citro-orange)] bg-citro-orange-light text-citro-orange",
                            isFuture &&
                              "border-border bg-card text-text-muted"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-3.5 w-3.5",
                              isCurrent &&
                                step.key === "processing" &&
                                "animate-spin"
                            )}
                          />
                        </div>
                        {!isLast && (
                          <div
                            className={cn(
                              "w-0.5 flex-1 min-h-[24px]",
                              isCompleted
                                ? "bg-[var(--status-delivered)]"
                                : "bg-border"
                            )}
                          />
                        )}
                      </div>
                      <div className={cn("pb-4", isLast && "pb-0")}>
                        <p
                          className={cn(
                            "text-sm font-medium leading-8",
                            isCompleted && "text-[var(--status-delivered)]",
                            isCurrent && "text-citro-orange",
                            isFuture && "text-text-muted"
                          )}
                        >
                          {step.label}
                        </p>
                        {stepDate && (
                          <p className="text-[10px] text-text-muted font-mono -mt-1">
                            {formatDate(stepDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-forest-teal" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  {order.projectName && (
                    <div>
                      <dt className="text-text-muted text-xs">Project Name</dt>
                      <dd className="text-text-primary font-medium mt-0.5">
                        {order.projectName}
                      </dd>
                    </div>
                  )}
                  {order.projectAddress && (
                    <div>
                      <dt className="text-text-muted text-xs">Address</dt>
                      <dd className="text-text-primary mt-0.5">
                        {order.projectAddress}
                      </dd>
                    </div>
                  )}
                  {order.estimatedInstallDate && (
                    <div>
                      <dt className="text-text-muted text-xs">
                        Estimated Install Date
                      </dt>
                      <dd className="text-text-primary mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-text-muted" />
                        {formatDate(order.estimatedInstallDate)}
                      </dd>
                    </div>
                  )}
                  {order.partnerNotes && (
                    <div>
                      <dt className="text-text-muted text-xs">
                        Partner Notes
                      </dt>
                      <dd className="text-text-secondary mt-0.5 whitespace-pre-wrap">
                        {order.partnerNotes}
                      </dd>
                    </div>
                  )}
                  {!order.projectName &&
                    !order.projectAddress &&
                    !order.estimatedInstallDate &&
                    !order.partnerNotes && (
                      <p className="text-text-muted text-xs italic">
                        No project details provided.
                      </p>
                    )}
                </dl>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Home className="h-4 w-4 text-forest-teal" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-primary whitespace-pre-wrap">
                    {order.shippingAddress}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-forest-teal" />
                  Products Ordered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const info = PRODUCT_INFO[item.product];
                    const Icon = info?.icon ?? Package;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-border p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                              info?.gradient ?? "from-gray-100 to-gray-200"
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-5 w-5",
                                info?.iconColor ?? "text-text-muted"
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary font-mono">
                              {info?.label ?? item.product}
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {info?.description ?? ""}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-text-secondary mt-1 italic">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-lg font-bold text-text-primary tabular-nums">
                            {item.quantity}
                          </p>
                          <p className="text-[10px] text-text-muted uppercase">
                            {info?.unit ?? "units"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Estimated Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-forest-teal" />
                  Estimated Pricing (for reference)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {estimatedPricing.lineItems.map((line, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-text-primary">
                          {line.product}
                        </span>
                        <span className="text-text-muted">
                          {line.quantity} {line.unit} @ {formatCurrency(line.unitPrice)}/{line.unit.replace(/s$/, "")}
                        </span>
                      </div>
                      <span className="font-mono text-text-primary tabular-nums">
                        {formatCurrency(line.lineTotal)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-primary">
                      Estimated Subtotal
                    </span>
                    <span className="text-base font-bold font-mono text-text-primary tabular-nums">
                      {formatCurrency(estimatedPricing.subtotal)}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted">
                    Pricing is estimated and may vary based on partner tier and
                    volume discounts. Final pricing will be on the invoice.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-forest-teal" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <dt className="text-text-muted text-xs">Submitted</dt>
                    <dd className="text-text-primary font-mono text-xs mt-0.5">
                      {formatDate(order.submittedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs">Confirmed</dt>
                    <dd className="text-text-primary font-mono text-xs mt-0.5">
                      {order.confirmedAt
                        ? formatDate(order.confirmedAt)
                        : "--"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs">Shipped</dt>
                    <dd className="text-text-primary font-mono text-xs mt-0.5">
                      {order.shippedAt ? formatDate(order.shippedAt) : "--"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs">Delivered</dt>
                    <dd className="text-text-primary font-mono text-xs mt-0.5">
                      {order.deliveredAt
                        ? formatDate(order.deliveredAt)
                        : "--"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Admin Controls + Partner Info */}
          <div className="space-y-6">
            {/* Status Actions - visual flow buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-citro-orange" />
                  Update Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allowedTransitions.length > 0 ? (
                  <>
                    {/* Visual current status */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-text-muted">Current:</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          statusColors[order.status]
                        )}
                      >
                        {order.status.charAt(0) +
                          order.status.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2">
                      {allowedTransitions
                        .filter((s) => s !== "CANCELLED")
                        .map((newStatus) => {
                          const Icon =
                            newStatus === "CONFIRMED"
                              ? CheckCircle2
                              : newStatus === "PROCESSING"
                              ? Loader2
                              : newStatus === "SHIPPED"
                              ? Truck
                              : PackageCheck;

                          return (
                            <Button
                              key={newStatus}
                              variant="outline"
                              fullWidth
                              onClick={() => {
                                setPendingStatus(newStatus);
                                setShipTrackingNumber("");
                              }}
                              className="justify-start"
                            >
                              <Icon className="h-4 w-4" />
                              Move to{" "}
                              {newStatus.charAt(0) +
                                newStatus.slice(1).toLowerCase()}
                            </Button>
                          );
                        })}

                      {allowedTransitions.includes("CANCELLED") && (
                        <>
                          <div className="border-t border-border pt-2 mt-2" />
                          <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => {
                              setPendingStatus("CANCELLED");
                              setShipTrackingNumber("");
                            }}
                            className="justify-start text-error hover:text-error hover:bg-error/5"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Cancel Order
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-text-muted italic">
                    {isCancelled
                      ? "This order has been cancelled. No further status changes are available."
                      : "This order has been delivered. No further status changes needed."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Invoice & Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-citro-orange" />
                  Invoice & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="payment-status-select"
                    className="text-xs text-text-secondary"
                  >
                    Payment Status
                  </Label>
                  <select
                    id="payment-status-select"
                    value={paymentStatus}
                    onChange={(e) =>
                      setPaymentStatus(e.target.value as PaymentStatus)
                    }
                    className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-citro-orange/40"
                  >
                    {(["PENDING", "INVOICED", "PAID"] as PaymentStatus[]).map(
                      (ps) => (
                        <option key={ps} value={ps}>
                          {paymentStatusLabels[ps]}
                        </option>
                      )
                    )}
                  </select>
                  <div className="mt-1">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        paymentStatusColors[paymentStatus]
                      )}
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      {paymentStatusLabels[paymentStatus]}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="invoice-number-input"
                    className="text-xs text-text-secondary"
                  >
                    Invoice Number
                  </Label>
                  <Input
                    id="invoice-number-input"
                    placeholder="e.g., INV-2026-0042"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="estimated-ship-date"
                    className="text-xs text-text-secondary"
                  >
                    Estimated Ship Date
                  </Label>
                  <Input
                    id="estimated-ship-date"
                    type="date"
                    value={estimatedShipDate}
                    onChange={(e) => setEstimatedShipDate(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleSavePayment}
                  loading={savingPayment}
                  disabled={!hasPaymentChanges || savingPayment}
                  fullWidth
                >
                  <Save className="h-4 w-4" />
                  {savingPayment ? "Saving..." : "Save Payment Info"}
                </Button>
              </CardContent>
            </Card>

            {/* Admin Notes & Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-citro-orange" />
                  Notes & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="tracking-number-input"
                    className="text-xs text-text-secondary"
                  >
                    Tracking Number
                  </Label>
                  <Input
                    id="tracking-number-input"
                    placeholder="Enter tracking number..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="admin-notes"
                    className="text-xs text-text-secondary"
                  >
                    Admin Notes
                  </Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add internal notes about this order..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                  />
                  <p className="text-[10px] text-text-muted">
                    Admin notes are visible to the partner. For cancelled
                    orders, this shows as the cancellation reason.
                  </p>
                </div>

                <Button
                  onClick={handleSaveNotes}
                  loading={saving}
                  disabled={!hasNoteChanges || saving}
                  fullWidth
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {/* Partner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-forest-teal" />
                  Partner Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-text-muted text-xs flex items-center gap-1">
                      <User className="h-3 w-3" /> Name
                    </dt>
                    <dd className="text-text-primary mt-0.5">
                      <Link
                        href={`/admin/partners/${order.partner.id}`}
                        className="hover:text-citro-orange transition-colors font-medium"
                      >
                        {order.partner.firstName} {order.partner.lastName}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> Company
                    </dt>
                    <dd className="text-text-primary mt-0.5">
                      {order.partner.companyName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted text-xs flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </dt>
                    <dd className="text-text-primary mt-0.5">
                      {order.partner.email}
                    </dd>
                  </div>
                  {order.partner.phone && (
                    <div>
                      <dt className="text-text-muted text-xs">Phone</dt>
                      <dd className="text-text-primary mt-0.5">
                        {order.partner.phone}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <Badge
                      variant={
                        order.partner.tier === "PREMIER"
                          ? "secondary"
                          : order.partner.tier === "CERTIFIED"
                          ? "default"
                          : "outline"
                      }
                    >
                      {order.partner.tier.charAt(0) +
                        order.partner.tier.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Change Confirmation Dialog */}
        <Dialog
          open={!!pendingStatus}
          onOpenChange={(open) => {
            if (!open) setPendingStatus(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle
                className={cn(
                  "flex items-center gap-2",
                  isDestructivePending && "text-error"
                )}
              >
                {isDestructivePending ? (
                  <AlertTriangle className="h-5 w-5 text-error" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-citro-orange" />
                )}
                {isDestructivePending
                  ? "Cancel Order?"
                  : `Update to ${
                      pendingStatus
                        ? pendingStatus.charAt(0) +
                          pendingStatus.slice(1).toLowerCase()
                        : ""
                    }?`}
              </DialogTitle>
              <DialogDescription>
                {isDestructivePending
                  ? `Are you sure you want to cancel order ${order.orderNumber}? This action cannot be undone. The partner will be notified.`
                  : `Change order ${order.orderNumber} from ${
                      order.status.charAt(0) +
                      order.status.slice(1).toLowerCase()
                    } to ${
                      pendingStatus
                        ? pendingStatus.charAt(0) +
                          pendingStatus.slice(1).toLowerCase()
                        : ""
                    }. The partner will be notified via email.`}
              </DialogDescription>
            </DialogHeader>

            {/* Visual status flow */}
            {pendingStatus && !isDestructivePending && (
              <div className="px-6 py-3">
                <div className="flex items-center justify-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      statusColors[order.status]
                    )}
                  >
                    {order.status.charAt(0) +
                      order.status.slice(1).toLowerCase()}
                  </span>
                  <div className="flex items-center gap-1 text-text-muted">
                    <div className="w-8 h-0.5 bg-border" />
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      statusColors[pendingStatus]
                    )}
                  >
                    {pendingStatus.charAt(0) +
                      pendingStatus.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            )}

            {/* Tracking number for SHIPPED - required */}
            {isShippingPending && (
              <div className="px-6 space-y-2">
                <Label
                  htmlFor="confirm-tracking"
                  className="text-xs text-text-secondary"
                >
                  Tracking Number
                  <span className="text-error ml-1">*</span>
                </Label>
                <Input
                  id="confirm-tracking"
                  placeholder="Enter tracking number..."
                  value={shipTrackingNumber}
                  onChange={(e) => setShipTrackingNumber(e.target.value)}
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
                onClick={() => setPendingStatus(null)}
                disabled={confirming}
              >
                Cancel
              </Button>
              <Button
                variant={isDestructivePending ? "destructive" : "default"}
                size="sm"
                onClick={handleConfirmedStatusChange}
                loading={confirming}
                disabled={
                  confirming ||
                  (isShippingPending && !shipTrackingNumber.trim())
                }
              >
                {isDestructivePending
                  ? "Yes, Cancel Order"
                  : `Update to ${
                      pendingStatus
                        ? pendingStatus.charAt(0) +
                          pendingStatus.slice(1).toLowerCase()
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
