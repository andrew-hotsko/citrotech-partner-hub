import { notFound } from "next/navigation";
import { requirePartner } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderDetail } from "@/components/orders/order-detail";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const partner = await requirePartner();
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order || order.partnerId !== partner.id) {
    notFound();
  }

  return (
    <OrderDetail
      order={{
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        projectName: order.projectName,
        projectAddress: order.projectAddress,
        estimatedInstallDate: order.estimatedInstallDate?.toISOString() ?? null,
        partnerNotes: order.partnerNotes,
        adminNotes: order.adminNotes,
        trackingNumber: (order as any).trackingNumber ?? null,
        submittedAt: order.submittedAt.toISOString(),
        confirmedAt: order.confirmedAt?.toISOString() ?? null,
        shippedAt: order.shippedAt?.toISOString() ?? null,
        deliveredAt: order.deliveredAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((item: typeof order.items[number]) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          notes: item.notes,
        })),
      }}
    />
  );
}
