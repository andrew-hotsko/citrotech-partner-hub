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

  // Build full warehouse address string from individual fields
  const warehouseAddressParts = [];
  if (partner.warehouseSameAsBusiness) {
    if (partner.address) warehouseAddressParts.push(partner.address);
    const cityStateZip = [partner.city, partner.state, partner.zip].filter(Boolean).join(", ");
    if (cityStateZip) warehouseAddressParts.push(cityStateZip);
  } else {
    if (partner.warehouseAddress) warehouseAddressParts.push(partner.warehouseAddress);
    const cityStateZip = [partner.warehouseCity, partner.warehouseState, partner.warehouseZip].filter(Boolean).join(", ");
    if (cityStateZip) warehouseAddressParts.push(cityStateZip);
  }
  const fullWarehouseAddress = warehouseAddressParts.length > 0 ? warehouseAddressParts.join(", ") : undefined;

  return (
    <Suspense>
      <OrdersList
        warehouseAddress={fullWarehouseAddress}
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
