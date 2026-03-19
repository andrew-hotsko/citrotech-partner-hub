import { Suspense } from "react";
import { requirePartner } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrdersList } from "@/components/orders/orders-list";

export default async function OrdersPage() {
  const partner = await requirePartner();

  const orders = await db.order.findMany({
    where: { partnerId: partner.id },
    orderBy: { submittedAt: "desc" },
    include: { items: true },
  });

  return (
    <Suspense>
      <OrdersList
        orders={orders.map((order: typeof orders[number]) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          projectName: order.projectName,
          submittedAt: order.submittedAt.toISOString(),
          items: order.items.map((item: typeof order.items[number]) => ({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
          })),
        }))}
      />
    </Suspense>
  );
}
