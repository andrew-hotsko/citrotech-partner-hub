"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-secondary-bg",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

Skeleton.displayName = "Skeleton";

export { Skeleton };
