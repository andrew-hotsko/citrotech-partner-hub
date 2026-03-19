import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-28 mt-2" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border-b border-border last:border-b-0"
            >
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24 hidden md:block" />
              <Skeleton className="h-5 w-16 hidden md:block" />
              <Skeleton className="h-5 w-16 hidden md:block" />
              <Skeleton className="h-5 w-12 hidden md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
