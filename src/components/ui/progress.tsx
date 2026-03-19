"use client";

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/* ================================================================== */
/*  ProgressBar                                                        */
/* ================================================================== */
const barVariantClasses = {
  default: "bg-citro-orange",
  success: "bg-success",
  warning: "bg-warning",
} as const;

const barSizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
} as const;

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  variant?: keyof typeof barVariantClasses;
  size?: keyof typeof barSizeClasses;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    { className, value, variant = "default", size = "md", ...props },
    ref
  ) => {
    const clamped = Math.max(0, Math.min(100, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "w-full overflow-hidden rounded-full bg-secondary-bg",
          barSizeClasses[size],
          className
        )}
        {...props}
      >
        <motion.div
          className={cn("h-full rounded-full", barVariantClasses[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    );
  }
);
ProgressBar.displayName = "ProgressBar";

/* ================================================================== */
/*  ProgressSteps                                                      */
/* ================================================================== */
export interface ProgressStep {
  label: string;
  status: "completed" | "current" | "upcoming";
}

export interface ProgressStepsProps
  extends React.HTMLAttributes<HTMLDivElement> {
  steps: ProgressStep[];
}

const ProgressSteps = forwardRef<HTMLDivElement, ProgressStepsProps>(
  ({ className, steps, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center w-full", className)}
      {...props}
    >
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;

        return (
          <React.Fragment key={i}>
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors duration-200",
                  step.status === "completed" &&
                    "bg-success text-white",
                  step.status === "current" &&
                    "bg-citro-orange text-white",
                  step.status === "upcoming" &&
                    "bg-secondary-bg text-text-muted border border-border"
                )}
              >
                {step.status === "completed" ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  i + 1
                )}
              </div>

              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  step.status === "current"
                    ? "font-semibold text-text-primary"
                    : "text-text-secondary"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-2 mt-[-1.25rem]">
                <div
                  className={cn(
                    "h-0.5 w-full rounded-full transition-colors duration-200",
                    step.status === "completed"
                      ? "bg-success"
                      : "bg-border"
                  )}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  )
);
ProgressSteps.displayName = "ProgressSteps";

export { ProgressBar, ProgressSteps };
