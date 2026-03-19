import { Skeleton } from "@/components/ui/skeleton";

export default function PartnersLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>

      {/* Search */}
      <Skeleton className="h-11 w-full max-w-sm" />

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
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-44 hidden md:block" />
              <Skeleton className="h-5 w-20 hidden md:block" />
              <Skeleton className="h-5 w-16 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
