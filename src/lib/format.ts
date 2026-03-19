/**
 * Format a date into a human-readable string.
 * @example formatDate(new Date()) // "Mar 18, 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date into a relative time string.
 * @example formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes === 1) return "1 minute ago";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  if (diffYears === 1) return "1 year ago";
  return `${diffYears} years ago`;
}

/**
 * Format a file size in bytes into a human-readable string.
 * @example formatFileSize(2500000) // "2.4 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  // Show decimals only for values >= KB
  if (i === 0) return `${bytes} B`;
  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[i]}`;
}

/**
 * Format an order number with a prefix and zero-padding.
 * @example formatOrderNumber(42) // "CT-00042"
 */
export function formatOrderNumber(num: number): string {
  return `CT-${String(num).padStart(5, "0")}`;
}

/**
 * Order/conversation status types used across the application.
 */
export type OrderStatus =
  | "submitted"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * Get the CSS custom property color value for a given status.
 * Returns the raw CSS variable reference for use in inline styles or
 * the Tailwind utility class color token name.
 */
export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    submitted: "var(--status-submitted)",
    confirmed: "var(--status-confirmed)",
    processing: "var(--status-processing)",
    shipped: "var(--status-shipped)",
    delivered: "var(--status-delivered)",
    cancelled: "var(--status-cancelled)",
  };
  return colors[status] ?? "var(--text-secondary)";
}

/**
 * Get the Lucide icon name for a given order status.
 * Returns the icon name as a string to be resolved by the consumer.
 */
export function getStatusIcon(status: OrderStatus): string {
  const icons: Record<OrderStatus, string> = {
    submitted: "ClipboardList",
    confirmed: "CheckCircle2",
    processing: "Loader2",
    shipped: "Truck",
    delivered: "PackageCheck",
    cancelled: "XCircle",
  };
  return icons[status] ?? "Circle";
}
