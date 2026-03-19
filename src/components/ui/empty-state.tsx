"use client";

import React, { forwardRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  EmptyState                                                         */
/* ------------------------------------------------------------------ */
export interface EmptyStateProps {
  className?: string;
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon: Icon, title, description, action }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-16",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-bg">
          <Icon className="h-7 w-7 text-text-muted" aria-hidden="true" />
        </div>
      )}

      <h3 className="text-base font-semibold text-text-primary font-display">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-text-secondary">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  )
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
