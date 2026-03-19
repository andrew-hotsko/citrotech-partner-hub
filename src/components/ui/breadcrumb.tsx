"use client";

import React, { forwardRef } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  BreadcrumbList                                                     */
/* ------------------------------------------------------------------ */
export interface BreadcrumbListProps
  extends React.HTMLAttributes<HTMLElement> {}

const BreadcrumbList = forwardRef<HTMLElement, BreadcrumbListProps>(
  ({ className, ...props }, ref) => (
    <nav ref={ref} aria-label="Breadcrumb" {...props}>
      <ol
        className={cn(
          "flex items-center gap-1.5 text-sm text-text-secondary",
          className
        )}
      >
        {props.children}
      </ol>
    </nav>
  )
);
BreadcrumbList.displayName = "BreadcrumbList";

/* ------------------------------------------------------------------ */
/*  BreadcrumbItem                                                     */
/* ------------------------------------------------------------------ */
export interface BreadcrumbItemProps
  extends React.LiHTMLAttributes<HTMLLIElement> {
  isCurrentPage?: boolean;
}

const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, isCurrentPage, ...props }, ref) => (
    <li
      ref={ref}
      className={cn("inline-flex items-center gap-1.5", className)}
      aria-current={isCurrentPage ? "page" : undefined}
      {...props}
    />
  )
);
BreadcrumbItem.displayName = "BreadcrumbItem";

/* ------------------------------------------------------------------ */
/*  BreadcrumbLink                                                     */
/* ------------------------------------------------------------------ */
export interface BreadcrumbLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  isCurrentPage?: boolean;
}

const BreadcrumbLink = forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, isCurrentPage, ...props }, ref) => {
    if (isCurrentPage) {
      return (
        <span
          className={cn(
            "text-sm font-medium text-text-primary",
            className
          )}
          aria-current="page"
        >
          {props.children}
        </span>
      );
    }

    return (
      <a
        ref={ref}
        className={cn(
          "text-sm text-text-secondary hover:text-text-primary transition-colors duration-150",
          className
        )}
        {...props}
      />
    );
  }
);
BreadcrumbLink.displayName = "BreadcrumbLink";

/* ------------------------------------------------------------------ */
/*  BreadcrumbSeparator                                                */
/* ------------------------------------------------------------------ */
export interface BreadcrumbSeparatorProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode;
}

const BreadcrumbSeparator = forwardRef<
  HTMLSpanElement,
  BreadcrumbSeparatorProps
>(({ className, icon, ...props }, ref) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn("text-text-muted", className)}
    {...props}
  >
    {icon ?? <ChevronRight className="h-3.5 w-3.5" />}
  </span>
));
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

export {
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
};
