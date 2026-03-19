import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationDetailLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] sm:h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="shrink-0 space-y-3 pb-4 border-b border-border">
        <Skeleton className="h-5 w-36" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-7 w-56" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden py-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <div className="space-y-1" style={{ maxWidth: "75%" }}>
              <Skeleton className="h-3 w-20" />
              <Skeleton
                className={`h-16 ${i % 2 === 0 ? "w-64" : "w-48"} rounded-2xl`}
              />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Reply bar */}
      <div className="shrink-0 border-t border-border pt-4">
        <div className="flex items-end gap-3">
          <Skeleton className="flex-1 h-[44px]" />
          <Skeleton className="h-11 w-20" />
        </div>
      </div>
    </div>
  );
}
