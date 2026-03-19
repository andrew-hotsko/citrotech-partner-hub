import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
      </div>

      {/* Partner info card skeleton */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-44" />
            </div>
          ))}
        </div>
      </div>

      {/* Certification card skeleton */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>
          ))}
        </div>
      </div>

      {/* Contact info skeleton */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-4">
        <Skeleton className="h-4 w-72" />
      </div>
    </div>
  );
}
