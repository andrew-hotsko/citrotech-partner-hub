"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border bg-card px-3 py-2",
        "text-sm text-text-primary placeholder:text-text-muted",
        "font-body",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-citro-orange focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
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

Input.displayName = "Input";

export { Input };
