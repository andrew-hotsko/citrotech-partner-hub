import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Skeleton className="h-5 w-28" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {/* Left (admin) bubble */}
        <div className="flex justify-start">
          <div className="max-w-[75%] space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-20 w-72 rounded-xl" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Right (partner) bubble */}
        <div className="flex justify-end">
          <div className="max-w-[75%] space-y-1 flex flex-col items-end">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-16 w-64 rounded-xl" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Left bubble */}
        <div className="flex justify-start">
          <div className="max-w-[75%] space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-14 w-56 rounded-xl" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>

        {/* Right bubble */}
        <div className="flex justify-end">
          <div className="max-w-[75%] space-y-1 flex flex-col items-end">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-24 w-80 rounded-xl" />
            <Skeleton className="h-3 w-18" />
          </div>
        </div>
      </div>

      {/* Reply bar */}
      <div className="flex items-end gap-3 border-t border-border pt-4">
        <Skeleton className="flex-1 h-11 rounded-lg" />
        <Skeleton className="h-11 w-20 rounded-lg" />
      </div>
    </div>
  );
}
