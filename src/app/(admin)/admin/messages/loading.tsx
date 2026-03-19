import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-40 mt-2" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-72" />

      {/* Conversation list */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-card)] border border-border bg-card p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-3 w-full max-w-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
