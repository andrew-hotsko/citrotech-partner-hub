"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  Loader2,
  Truck,
  PackageCheck,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Copy,
  Check,
  RotateCcw,
  Package,
  Leaf,
  Shield,
  XCircle,
  Clock,
  DollarSign,
  Receipt,
  CreditCard,
  ExternalLink,
  Info,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import {
  PRODUCTS as PRICING_PRODUCTS,
  getEstimatedSubtotal,
  formatCurrency,
  LEAD_TIME_DAYS,
} from "@/lib/pricing";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItemData {
  id: string;
  product: "MFB_31" | "MFB_34";
  quantity: number;
  notes: string | null;
}

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
  paymentStatus: string | null;
  invoiceNumber: string | null;
  estimatedShipDate: string | null;
  submittedAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: OrderItemData[];
}

interface OrderDetailProps {
  order: OrderData;
  onReorder?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRODUCT_INFO: Record<
  string,
  {
    label: string;
    pricingId: string;
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
    pricingId: "MFB-31",
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
    pricingId: "MFB-34",
    name: "Structural Treatment",
    description:
      "Protects decks, fences, siding, and other structures from fire",
    icon: Shield,
    iconColor: "text-blue-600",
    gradient: "from-blue-500/10 to-indigo-500/10",
    unit: "gallons",
  },
};

/** Look up pricing product data */
function getPricingProduct(pricingId: string) {
  return PRICING_PRODUCTS.find((p) => p.id === pricingId);
}

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
  description: string;
}

const TIMELINE_STEPS: TimelineStep[] = [
  {
    key: "submitted",
    label: "Submitted",
    icon: ClipboardList,
    description: "Order received",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    icon: CheckCircle2,
    description: "Order confirmed by team",
  },
  {
    key: "processing",
    label: "Processing",
    icon: Loader2,
    description: "Being prepared for shipment",
  },
  {
    key: "shipped",
    label: "Shipped",
    icon: Truck,
    description: "On the way to you",
  },
  {
    key: "delivered",
    label: "Delivered",
    icon: PackageCheck,
    description: "Successfully delivered",
  },
];

const STATUS_ORDER: Record<string, number> = {
  SUBMITTED: 0,
  CONFIRMED: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
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

/* Estimated delivery: 5-7 business days from shipped date, or from confirmed date */
function getEstimatedDelivery(order: OrderData): string | null {
  if (order.status === "DELIVERED" || order.status === "CANCELLED") return null;
  const baseDate = order.shippedAt || order.confirmedAt || order.submittedAt;
  if (!baseDate) return null;
  const base = new Date(baseDate);
  const minDays = order.shippedAt ? 3 : order.confirmedAt ? 5 : 7;
  const maxDays = order.shippedAt ? 5 : order.confirmedAt ? 10 : 14;
  const minDate = new Date(base);
  const maxDate = new Date(base);
  minDate.setDate(minDate.getDate() + minDays);
  maxDate.setDate(maxDate.getDate() + maxDays);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${fmt(minDate)} - ${fmt(maxDate)}`;
}

/* ------------------------------------------------------------------ */
/*  Payment Status Badge                                               */
/* ------------------------------------------------------------------ */

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    PENDING: {
      bg: "bg-[var(--status-processing)]/10",
      text: "text-[var(--status-processing)]",
      label: "Pending",
    },
    INVOICED: {
      bg: "bg-[var(--status-submitted)]/10",
      text: "text-[var(--status-submitted)]",
      label: "Invoiced",
    },
    PAID: {
      bg: "bg-[var(--status-delivered)]/10",
      text: "text-[var(--status-delivered)]",
      label: "Paid",
    },
  };

  const c = config[status] ?? config.PENDING;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        c.bg,
        c.text
      )}
    >
      <CreditCard className="h-3 w-3" />
      {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrderDetail({ order, onReorder }: OrderDetailProps) {
  const router = useRouter();
  const currentIndex = STATUS_ORDER[order.status] ?? -1;
  const isCancelled = order.status === "CANCELLED";
  const isDelivered = order.status === "DELIVERED";

  // Copy order number state
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = useCallback(() => {
    navigator.clipboard.writeText(order.orderNumber).then(() => {
      setCopied(true);
      toast.success("Copied!", { duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    });
  }, [order.orderNumber]);

  // Reorder
  const handleReorder = useCallback(() => {
    if (onReorder) {
      onReorder();
      return;
    }

    const params = new URLSearchParams();
    params.set("reorder", "true");

    for (const item of order.items) {
      if (item.product === "MFB_31") {
        params.set("mfb31", String(item.quantity));
      }
      if (item.product === "MFB_34") {
        params.set("mfb34", String(item.quantity));
      }
    }

    if (order.projectName) {
      params.set("projectName", order.projectName);
    }
    if (order.projectAddress) {
      params.set("projectAddress", order.projectAddress);
    }

    router.push(`/orders?${params.toString()}`);
  }, [order, router, onReorder]);

  const estimatedDelivery = getEstimatedDelivery(order);

  // Calculate estimated pricing
  const pricingItems = order.items.map((item) => ({
    productId: PRODUCT_INFO[item.product]?.pricingId ?? "",
    quantity: item.quantity,
  }));
  const estimatedSubtotal = getEstimatedSubtotal(pricingItems);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/orders"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>

        {/* Order header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-text-primary tracking-tight">
              {order.orderNumber}
            </h1>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-secondary-bg transition-colors duration-150"
              title="Copy order number"
              aria-label={`Copy order number ${order.orderNumber}`}
            >
              {copied ? (
                <Check className="h-4 w-4 text-[var(--status-delivered)]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
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

          {/* Reorder button - prominent on delivered orders */}
          <Button
            variant={isDelivered ? "default" : "outline"}
            onClick={handleReorder}
            className={cn(isDelivered && "shadow-md")}
          >
            <RotateCcw className="h-4 w-4" />
            {isDelivered ? "Order Again" : "Reorder"}
          </Button>
        </div>

        {/* Cancelled state */}
        {isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-[var(--status-cancelled)]/30 bg-[var(--status-cancelled)]/[0.03]">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-[var(--status-cancelled)]/10 flex items-center justify-center shrink-0 mt-0.5">
                    <XCircle className="h-5 w-5 text-[var(--status-cancelled)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-text-primary mb-1">
                      Order Cancelled
                    </h3>
                    {order.adminNotes ? (
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">Reason: </span>
                        {order.adminNotes}
                      </p>
                    ) : (
                      <p className="text-sm text-text-muted">
                        This order has been cancelled. Contact support if you
                        have questions.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Status Timeline - visual progress bar style */}
        {!isCancelled && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Order Progress</CardTitle>
                {estimatedDelivery && (
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Est. delivery: <strong>{estimatedDelivery}</strong>
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Desktop: horizontal */}
              <div className="hidden sm:flex items-start justify-between relative">
                {/* Background line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
                {/* Progress line */}
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
                          "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                          isCompleted &&
                            "bg-[var(--status-delivered)] border-[var(--status-delivered)] text-white scale-100",
                          isCurrent &&
                            "border-[var(--citro-orange)] bg-citro-orange-light text-citro-orange scale-110 shadow-md shadow-citro-orange/20",
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
                          isCurrent && "text-citro-orange font-semibold",
                          isFuture && "text-text-muted"
                        )}
                      >
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] text-text-muted">
                          {step.description}
                        </span>
                      )}
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
                    <motion.div
                      key={step.key}
                      className="flex gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.25 }}
                    >
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
                        {isCurrent && (
                          <p className="text-xs text-text-muted -mt-1">
                            {step.description}
                          </p>
                        )}
                        {stepDate && (
                          <p className="text-[10px] text-text-muted font-mono mt-0.5">
                            {formatDate(stepDate)}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Tracking number */}
              {order.trackingNumber && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 pt-4 border-t border-border"
                >
                  <div className="flex items-center justify-between rounded-lg bg-secondary-bg/50 p-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-text-muted" />
                      <span className="text-xs text-text-muted">
                        Tracking Number
                      </span>
                    </div>
                    <span className="text-sm font-mono font-semibold text-text-primary">
                      {order.trackingNumber}
                    </span>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Status Section */}
        {order.paymentStatus && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-forest-teal" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <PaymentStatusBadge status={order.paymentStatus} />
                  {order.invoiceNumber && (
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Invoice</p>
                      <p className="text-sm font-mono font-semibold text-text-primary">
                        {order.invoiceNumber}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Shipping Info Section */}
        {(order.shippingAddress ||
          order.estimatedShipDate ||
          order.trackingNumber) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4 text-forest-teal" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  {order.shippingAddress && (
                    <div>
                      <dt className="text-text-muted text-xs">
                        Shipping Address
                      </dt>
                      <dd className="text-text-primary mt-0.5 flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                        {order.shippingAddress}
                      </dd>
                    </div>
                  )}
                  {order.estimatedShipDate && (
                    <div>
                      <dt className="text-text-muted text-xs">
                        Estimated Ship Date
                      </dt>
                      <dd className="text-text-primary mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-text-muted" />
                        {formatDate(order.estimatedShipDate)}
                      </dd>
                    </div>
                  )}
                  {order.trackingNumber && (
                    <div>
                      <dt className="text-text-muted text-xs">
                        Tracking Number
                      </dt>
                      <dd className="text-text-primary mt-0.5 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-text-muted" />
                        <span className="font-mono font-semibold">
                          {order.trackingNumber}
                        </span>
                        <span className="text-xs text-text-muted flex items-center gap-0.5 ml-1">
                          <ExternalLink className="h-3 w-3" />
                          Track Shipment
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Info & Items grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Items with pricing - shown first for prominence */}
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
                  const pricing = info
                    ? getPricingProduct(info.pricingId)
                    : undefined;
                  const lineTotal = pricing
                    ? pricing.basePrice * item.quantity
                    : null;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
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
                          {pricing && (
                            <p className="text-[10px] text-text-muted mt-0.5 tabular-nums">
                              {formatCurrency(pricing.basePrice)} x{" "}
                              {item.quantity} {info?.unit ?? "units"}
                            </p>
                          )}
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
                        {lineTotal !== null && (
                          <p className="text-xs font-medium text-text-secondary tabular-nums mt-0.5">
                            {formatCurrency(lineTotal)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pricing Summary */}
                {estimatedSubtotal > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between rounded-lg border border-citro-orange/20 bg-citro-orange/[0.03] p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-citro-orange" />
                        <span className="text-sm font-medium text-text-secondary">
                          Estimated Subtotal
                        </span>
                      </div>
                      <span className="text-lg font-bold text-text-primary tabular-nums">
                        {formatCurrency(estimatedSubtotal)}
                      </span>
                    </div>
                    <p className="text-[10px] text-text-muted inline-flex items-center gap-1">
                      <Info className="h-3 w-3 shrink-0" />
                      <span>Final pricing per your invoice</span>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
                    <dt className="text-text-muted text-xs">Your Notes</dt>
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
        </div>

        {/* Admin Notes (non-cancelled - cancelled shows reason above) */}
        {order.adminNotes && !isCancelled && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-citro-orange" />
                Notes from CitroTech
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">
                {order.adminNotes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dates */}
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
                  {order.confirmedAt ? formatDate(order.confirmedAt) : "--"}
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
                  {order.deliveredAt ? formatDate(order.deliveredAt) : "--"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Prominent reorder CTA for delivered orders */}
        {isDelivered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-citro-orange/20 bg-citro-orange/[0.02]">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-citro-orange/10 flex items-center justify-center shrink-0">
                      <RotateCcw className="h-5 w-5 text-citro-orange" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary">
                        Need to reorder?
                      </h3>
                      <p className="text-xs text-text-muted">
                        Place the same order again with just one click.
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleReorder} className="shadow-md">
                    <RotateCcw className="h-4 w-4" />
                    Order Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
