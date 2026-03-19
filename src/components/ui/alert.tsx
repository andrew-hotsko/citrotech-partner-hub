"use client";

import React, { forwardRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Variant configuration                                              */
/* ------------------------------------------------------------------ */
const variantConfig: Record<
  string,
  { icon: LucideIcon; border: string; bg: string; iconColor: string }
> = {
  info: {
    icon: Info,
    border: "border-l-info",
    bg: "bg-info/5",
    iconColor: "text-info",
  },
  success: {
    icon: CheckCircle2,
    border: "border-l-success",
    bg: "bg-success/5",
    iconColor: "text-success",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-warning",
    bg: "bg-warning/5",
    iconColor: "text-warning",
  },
  error: {
    icon: XCircle,
    border: "border-l-error",
    bg: "bg-error/5",
    iconColor: "text-error",
  },
};

/* ------------------------------------------------------------------ */
/*  Alert                                                              */
/* ------------------------------------------------------------------ */
export interface AlertProps {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  icon?: LucideIcon;
  dismissible?: boolean;
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      icon,
      dismissible = false,
      action,
      onDismiss,
      children,
    },
    ref
  ) => {
    const [visible, setVisible] = useState(true);
    const config = variantConfig[variant];
    const IconComponent = icon ?? config.icon;

    const handleDismiss = () => {
      setVisible(false);
      onDismiss?.();
    };

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={ref}
            role="alert"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative flex gap-3 rounded-lg border border-l-4 p-4",
              config.border,
              config.bg,
              "border-border",
              className
            )}
          >
            <IconComponent
              className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)}
              aria-hidden="true"
            />

            <div className="flex-1 min-w-0">
              {title && (
                <p className="text-sm font-semibold text-text-primary mb-1">
                  {title}
                </p>
              )}
              {children && (
                <div className="text-sm text-text-secondary">{children}</div>
              )}
              {action && <div className="mt-3">{action}</div>}
            </div>

            {dismissible && (
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-text-secondary hover:text-text-primary hover:bg-secondary-bg transition-colors"
                onClick={handleDismiss}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

Alert.displayName = "Alert";

export { Alert };
