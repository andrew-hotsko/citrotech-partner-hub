import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { OrderDetailAdmin } from "@/components/admin/order-detail-admin";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      partner: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Serialize dates and include new fields for the client component
  const serializedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    projectName: order.projectName,
    projectAddress: order.projectAddress,
    shippingAddress: (order as any).shippingAddress ?? null,
    estimatedInstallDate: order.estimatedInstallDate?.toISOString() ?? null,
    partnerNotes: order.partnerNotes,
    adminNotes: order.adminNotes,
    trackingNumber: (order as any).trackingNumber ?? null,
    paymentStatus: (order as any).paymentStatus ?? null,
    invoiceNumber: (order as any).invoiceNumber ?? null,
    estimatedShipDate: (order as any).estimatedShipDate
      ? new Date((order as any).estimatedShipDate).toISOString()
      : null,
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
    partner: {
      id: order.partner.id,
      firstName: order.partner.firstName,
      lastName: order.partner.lastName,
      companyName: order.partner.companyName,
      email: order.partner.email,
      phone: order.partner.phone,
      tier: order.partner.tier,
      status: order.partner.status,
    },
  };

  return <OrderDetailAdmin order={serializedOrder} />;
}
