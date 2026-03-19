"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  default:
    "bg-citro-orange text-white hover:bg-citro-orange-dark active:bg-citro-orange-dark",
  secondary:
    "bg-forest-teal text-white hover:bg-forest-teal-light active:bg-forest-teal-light",
  outline:
    "border border-border bg-transparent text-text-primary hover:bg-secondary-bg active:bg-secondary-bg",
  ghost:
    "bg-transparent text-text-primary hover:bg-secondary-bg active:bg-secondary-bg",
  destructive:
    "bg-error text-white hover:bg-red-700 active:bg-red-800",
} as const;

const sizeClasses = {
  sm: "h-9 px-3 text-sm gap-1.5",
  default: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
  fullWidth?: boolean;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      fullWidth = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg",
          "transition-colors duration-150 ease-in-out",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-citro-orange",
          "disabled:opacity-50 disabled:pointer-events-none",
          "cursor-pointer",
          "select-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 h-4 w-4 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
