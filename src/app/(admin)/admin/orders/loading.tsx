import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-36 mt-2" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-full max-w-2xl" />

      {/* Table */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border-b border-border last:border-b-0"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-40 hidden md:block" />
              <Skeleton className="h-5 w-20 hidden md:block" />
              <Skeleton className="h-5 w-28 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
