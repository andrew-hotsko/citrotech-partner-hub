import { Skeleton } from "@/components/ui/skeleton";

export default function SupportLoading() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56 mt-2" />
        </div>
      </div>

      {/* Emergency card skeleton */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 border-l-4 space-y-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Standard support skeleton */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-11 w-40 rounded-lg mt-2" />
      </div>

      {/* Contacts skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-card)] border border-border bg-card p-6 space-y-3"
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>

      {/* FAQ skeleton */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 space-y-4">
        <Skeleton className="h-6 w-56" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-border py-4">
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
