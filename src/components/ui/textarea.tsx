"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-lg border bg-card px-3 py-2.5",
        "text-sm text-text-primary placeholder:text-text-muted",
        "font-body leading-relaxed",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citro-orange focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "resize-y",
        error
          ? "border-error focus-visible:ring-error"
          : "border-border",
        className
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";

export { Textarea };
