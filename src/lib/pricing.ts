// ──────────────────────────────────────────────────────────────
// CitroTech Partner Hub – Product Pricing Data
// Display-only pricing configuration for partner order forms
// These are informational estimates - final pricing is confirmed by the ops team
// ──────────────────────────────────────────────────────────────

export const PRODUCTS = [
  {
    id: "MFB-31",
    name: "MFB-31 Fire Barrier",
    description:
      "Interior/exterior fire barrier coating for residential and light commercial structures. Applied via airless sprayer.",
    basePrice: 42.5, // per gallon
    unit: "gallon",
    minQuantity: 5,
    coverage: "~100 sq ft per gallon at recommended thickness",
  },
  {
    id: "MFB-34",
    name: "MFB-34 Fire Barrier",
    description:
      "Heavy-duty fire barrier coating for commercial and industrial structures. Enhanced thermal resistance rating.",
    basePrice: 56.75, // per gallon
    unit: "gallon",
    minQuantity: 5,
    coverage: "~80 sq ft per gallon at recommended thickness",
  },
] as const;

export type Product = (typeof PRODUCTS)[number];
export type ProductId = (typeof PRODUCTS)[number]["id"];

export const TIER_DISCOUNTS: Record<string, { label: string; discount: number }> = {
  AUTHORIZED: { label: "Authorized Partner", discount: 0 },
  PREMIER: { label: "Premier Partner", discount: 0.10 },
  ELITE: { label: "Elite Partner", discount: 0.15 },
};

/**
 * Look up a product by its ID (e.g. "MFB-31").
 */
export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/**
 * Calculate the estimated subtotal for a list of order items.
 */
export function getEstimatedSubtotal(
  items: { productId: string; quantity: number }[],
): number {
  return items.reduce((sum, item) => {
    const product = getProductById(item.productId);
    if (!product) return sum;
    return sum + product.basePrice * item.quantity;
  }, 0);
}

/**
 * Format a number as USD currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Estimated lead time in business days.
 */
export const LEAD_TIME_DAYS = { min: 5, max: 7 } as const;
