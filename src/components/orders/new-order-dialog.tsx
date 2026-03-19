"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Minus,
  Plus,
  MapPin,
  Calendar,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  Sparkles,
  Leaf,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ProgressSteps, type ProgressStep } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types & Constants                                                   */
/* ------------------------------------------------------------------ */

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: {
    mfb31Qty?: number;
    mfb34Qty?: number;
    projectName?: string;
    projectAddress?: string;
  };
}

interface ProductSelection {
  selected: boolean;
  quantity: number;
}

const NOTES_MAX_LENGTH = 500;

const PRODUCTS = [
  {
    key: "mfb31" as const,
    code: "MFB-31",
    apiCode: "MFB_31",
    name: "Vegetation Treatment",
    description:
      "Protects landscaping, brush, and ground cover from wildfire ignition. Applied directly to organic materials for long-lasting fire resistance.",
    unit: "gallons",
    icon: Leaf,
    gradient: "from-emerald-500/10 to-green-500/10",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-600",
  },
  {
    key: "mfb34" as const,
    code: "MFB-34",
    apiCode: "MFB_34",
    name: "Structural Treatment",
    description:
      "Protects decks, fences, siding, and other structures. Creates a fire-resistant barrier on wood and composite materials.",
    unit: "gallons",
    icon: Shield,
    gradient: "from-blue-500/10 to-indigo-500/10",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-600",
  },
];

/* ------------------------------------------------------------------ */
/*  Step indicator helpers                                              */
/* ------------------------------------------------------------------ */

const STEP_LABELS = ["Select Products", "Project Details", "Review & Submit"];

function getStepStatuses(currentStep: number): ProgressStep[] {
  return STEP_LABELS.map((label, i) => ({
    label,
    status:
      i < currentStep
        ? ("completed" as const)
        : i === currentStep
        ? ("current" as const)
        : ("upcoming" as const),
  }));
}

/* ------------------------------------------------------------------ */
/*  Quantity Selector                                                   */
/* ------------------------------------------------------------------ */

function QuantitySelector({
  value,
  onChange,
  unit,
}: {
  value: number;
  onChange: (v: number) => void;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center text-text-secondary hover:bg-secondary-bg hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-bold text-text-primary tabular-nums w-8 text-center">
          {value}
        </span>
        <span className="text-xs text-text-muted">{unit}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center text-text-secondary hover:bg-secondary-bg hover:text-text-primary transition-colors"
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step transitions                                                    */
/* ------------------------------------------------------------------ */

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export function NewOrderDialog({
  open,
  onOpenChange,
  prefill,
}: NewOrderDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Product selections
  const [products, setProducts] = useState<
    Record<"mfb31" | "mfb34", ProductSelection>
  >({
    mfb31: {
      selected: !!prefill?.mfb31Qty,
      quantity: prefill?.mfb31Qty || 1,
    },
    mfb34: {
      selected: !!prefill?.mfb34Qty,
      quantity: prefill?.mfb34Qty || 1,
    },
  });

  // Project details
  const [projectName, setProjectName] = useState(prefill?.projectName || "");
  const [projectAddress, setProjectAddress] = useState(
    prefill?.projectAddress || ""
  );
  const [estimatedInstallDate, setEstimatedInstallDate] = useState("");
  const [partnerNotes, setPartnerNotes] = useState("");

  // Validation
  const [dateError, setDateError] = useState<string | null>(null);

  const hasProductSelected = products.mfb31.selected || products.mfb34.selected;

  const todayStr = useMemo(() => {
    const now = new Date();
    return now.toISOString().split("T")[0];
  }, []);

  const resetForm = useCallback(() => {
    setStep(0);
    setDirection(1);
    setProducts({
      mfb31: { selected: false, quantity: 1 },
      mfb34: { selected: false, quantity: 1 },
    });
    setProjectName("");
    setProjectAddress("");
    setEstimatedInstallDate("");
    setPartnerNotes("");
    setDateError(null);
  }, []);

  const toggleProduct = useCallback(
    (key: "mfb31" | "mfb34") => {
      setProducts((prev) => ({
        ...prev,
        [key]: { ...prev[key], selected: !prev[key].selected },
      }));
    },
    []
  );

  const updateQuantity = useCallback(
    (key: "mfb31" | "mfb34", qty: number) => {
      setProducts((prev) => ({
        ...prev,
        [key]: { ...prev[key], quantity: qty },
      }));
    },
    []
  );

  const goNext = useCallback(() => {
    // Validate current step
    if (step === 0 && !hasProductSelected) {
      toast.error("Please select at least one product");
      return;
    }
    if (step === 1) {
      // Validate date if provided
      if (estimatedInstallDate) {
        const selected = new Date(estimatedInstallDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selected < today) {
          setDateError("Install date must be in the future");
          return;
        }
      }
      setDateError(null);
    }
    setDirection(1);
    setStep((s) => Math.min(2, s + 1));
  }, [step, hasProductSelected, estimatedInstallDate]);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleSubmit = useCallback(async () => {
    const items: { product: "MFB_31" | "MFB_34"; quantity: number }[] = [];
    if (products.mfb31.selected)
      items.push({ product: "MFB_31", quantity: products.mfb31.quantity });
    if (products.mfb34.selected)
      items.push({ product: "MFB_34", quantity: products.mfb34.quantity });

    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          projectName: projectName || undefined,
          projectAddress: projectAddress || undefined,
          estimatedInstallDate: estimatedInstallDate || undefined,
          partnerNotes: partnerNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to place order");
      }

      toast.success("Order placed successfully!", {
        description: "You will receive a confirmation email shortly.",
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
      onOpenChange(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    products,
    projectName,
    projectAddress,
    estimatedInstallDate,
    partnerNotes,
    onOpenChange,
    resetForm,
    router,
  ]);

  const selectedProducts = PRODUCTS.filter((p) => products[p.key].selected);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with stepper */}
        <div className="p-6 pb-4 border-b border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-citro-orange/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-citro-orange" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary font-display">
                Place New Order
              </h2>
              <p className="text-sm text-text-secondary">
                {STEP_LABELS[step]}
              </p>
            </div>
          </div>

          <ProgressSteps steps={getStepStatuses(step)} />
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Select Products */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 space-y-4"
              >
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-semibold text-text-primary">
                    Choose your products
                  </h3>
                  <p className="text-xs text-text-muted">
                    Select one or both CitroTech fire barrier products for your
                    project.
                  </p>
                </div>

                <div className="space-y-4">
                  {PRODUCTS.map((product) => {
                    const sel = products[product.key];
                    const Icon = product.icon;

                    return (
                      <motion.div
                        key={product.key}
                        layout
                        className={cn(
                          "relative rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer",
                          sel.selected
                            ? "border-citro-orange bg-citro-orange/[0.03] shadow-sm"
                            : "border-border hover:border-citro-orange/40 hover:shadow-sm"
                        )}
                        onClick={() => toggleProduct(product.key)}
                      >
                        {/* Selected indicator */}
                        {sel.selected && (
                          <motion.div
                            className="absolute top-3 right-3"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 25,
                            }}
                          >
                            <div className="h-6 w-6 rounded-full bg-citro-orange flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0",
                              product.gradient
                            )}
                          >
                            <Icon className={cn("h-6 w-6", product.iconColor)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-sm font-bold text-text-primary">
                                {product.code}
                              </span>
                              <span className="text-sm font-medium text-text-secondary">
                                {product.name}
                              </span>
                            </div>
                            <p className="text-xs text-text-muted leading-relaxed">
                              {product.description}
                            </p>
                          </div>
                        </div>

                        {/* Quantity selector (visible when selected) */}
                        <AnimatePresence>
                          {sel.selected && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{
                                opacity: 1,
                                height: "auto",
                                marginTop: 16,
                              }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                <span className="text-sm font-medium text-text-secondary">
                                  Quantity
                                </span>
                                <QuantitySelector
                                  value={sel.quantity}
                                  onChange={(q) =>
                                    updateQuantity(product.key, q)
                                  }
                                  unit={product.unit}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {!hasProductSelected && (
                  <p className="text-xs text-text-muted text-center pt-2">
                    Click a product card to select it
                  </p>
                )}
              </motion.div>
            )}

            {/* Step 2: Project Details */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 space-y-5"
              >
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-forest-teal" />
                    Project Information
                  </h3>
                  <p className="text-xs text-text-muted">
                    Tell us about the project where these products will be used.
                    All fields are optional.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="new-order-project-name"
                    className="text-xs text-text-secondary"
                  >
                    Project Name
                  </Label>
                  <Input
                    id="new-order-project-name"
                    placeholder="e.g., Sunset Ridge Development"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="new-order-address"
                    className="text-xs text-text-secondary"
                  >
                    Project Address
                  </Label>
                  <Input
                    id="new-order-address"
                    placeholder="123 Main St, City, State"
                    value={projectAddress}
                    onChange={(e) => setProjectAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="new-order-date"
                    className="text-xs text-text-secondary flex items-center gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Estimated Install Date
                  </Label>
                  <Input
                    id="new-order-date"
                    type="date"
                    min={todayStr}
                    value={estimatedInstallDate}
                    onChange={(e) => {
                      setEstimatedInstallDate(e.target.value);
                      setDateError(null);
                    }}
                  />
                  {dateError && (
                    <p className="text-xs text-error">{dateError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="new-order-notes"
                      className="text-xs text-text-secondary"
                    >
                      Notes
                    </Label>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        partnerNotes.length > NOTES_MAX_LENGTH
                          ? "text-error font-medium"
                          : partnerNotes.length > NOTES_MAX_LENGTH * 0.9
                          ? "text-[var(--status-submitted)]"
                          : "text-text-muted"
                      )}
                    >
                      {partnerNotes.length}/{NOTES_MAX_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    id="new-order-notes"
                    placeholder="Any special instructions, access details, or notes for this order..."
                    value={partnerNotes}
                    onChange={(e) => {
                      if (e.target.value.length <= NOTES_MAX_LENGTH) {
                        setPartnerNotes(e.target.value);
                      }
                    }}
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Review & Submit */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 space-y-5"
              >
                <div className="space-y-2 mb-2">
                  <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-citro-orange" />
                    Review Your Order
                  </h3>
                  <p className="text-xs text-text-muted">
                    Please verify everything looks correct before placing your
                    order.
                  </p>
                </div>

                {/* Products Summary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    Products
                  </h4>
                  {selectedProducts.map((product) => {
                    const sel = products[product.key];
                    const Icon = product.icon;
                    return (
                      <div
                        key={product.key}
                        className="flex items-center justify-between rounded-lg border border-border p-4 bg-secondary-bg/30"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center",
                              product.gradient
                            )}
                          >
                            <Icon
                              className={cn("h-4 w-4", product.iconColor)}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary font-mono">
                              {product.code}
                            </p>
                            <p className="text-xs text-text-muted">
                              {product.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-text-primary tabular-nums">
                            {sel.quantity}
                          </p>
                          <p className="text-xs text-text-muted">
                            {product.unit}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Project Details Summary */}
                {(projectName ||
                  projectAddress ||
                  estimatedInstallDate ||
                  partnerNotes) && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      Project Details
                    </h4>
                    <div className="rounded-lg border border-border p-4 bg-secondary-bg/30 space-y-2.5">
                      {projectName && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-text-muted">
                              Project Name
                            </p>
                            <p className="text-sm text-text-primary">
                              {projectName}
                            </p>
                          </div>
                        </div>
                      )}
                      {projectAddress && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-text-muted">Address</p>
                            <p className="text-sm text-text-primary">
                              {projectAddress}
                            </p>
                          </div>
                        </div>
                      )}
                      {estimatedInstallDate && (
                        <div className="flex items-start gap-2">
                          <Calendar className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-text-muted">
                              Install Date
                            </p>
                            <p className="text-sm text-text-primary">
                              {new Date(
                                estimatedInstallDate + "T00:00:00"
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      {partnerNotes && (
                        <div className="flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-text-muted mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-text-muted">Notes</p>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">
                              {partnerNotes}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!projectName &&
                  !projectAddress &&
                  !estimatedInstallDate &&
                  !partnerNotes && (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center">
                      <p className="text-xs text-text-muted">
                        No project details provided. You can go back to add
                        them.
                      </p>
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with navigation buttons */}
        <div className="p-6 pt-4 border-t border-border flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 2 ? (
            <Button
              size="sm"
              onClick={goNext}
              disabled={step === 0 && !hasProductSelected}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              <Package className="h-4 w-4" />
              {submitting ? "Placing Order..." : "Place Order"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
