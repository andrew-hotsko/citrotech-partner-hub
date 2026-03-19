import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrdersManager } from "@/components/admin/orders-manager";

export default async function AdminOrdersPage() {
  await requireAdmin();

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      partner: { select: { firstName: true, lastName: true, companyName: true } },
      items: true,
    },
  });

  return <OrdersManager orders={JSON.parse(JSON.stringify(orders))} />;
}
