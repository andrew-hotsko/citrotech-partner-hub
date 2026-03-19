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

  return <OrderDetailAdmin order={JSON.parse(JSON.stringify(order))} />;
}
