"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  default: "bg-citro-orange/15 text-citro-orange",
  secondary: "bg-forest-teal/15 text-forest-teal",
  outline: "border border-border bg-transparent text-text-secondary",
  destructive: "bg-error/15 text-error",
} as const;

const statusClasses = {
  submitted: "bg-status-submitted/15 text-status-submitted",
  confirmed: "bg-status-confirmed/15 text-status-confirmed",
  processing: "bg-status-processing/15 text-status-processing",
  shipped: "bg-status-shipped/15 text-status-shipped",
  delivered: "bg-status-delivered/15 text-status-delivered",
  cancelled: "bg-status-cancelled/15 text-status-cancelled",
} as const;

type BadgeVariant = keyof typeof variantClasses;
type StatusVariant = keyof typeof statusClasses;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  status?: StatusVariant;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", status, ...props }, ref) => {
    const classes = status ? statusClasses[status] : variantClasses[variant];

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5",
          "text-xs font-medium leading-5",
          "whitespace-nowrap select-none",
          classes,
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
