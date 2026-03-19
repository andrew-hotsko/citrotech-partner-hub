import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [
    totalPartners,
    activePartners,
    pendingOrders,
    totalDocuments,
    unreadConversations,
    recentOrders,
    recentConversations,
  ] = await Promise.all([
    db.partner.count(),
    db.partner.count({ where: { status: "ACTIVE" } }),
    db.order.count({ where: { status: "SUBMITTED" } }),
    db.document.count(),
    db.conversation.count({
      where: {
        messages: {
          some: {
            senderType: "PARTNER",
            isReadByAdmin: false,
          },
        },
      },
    }),
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        partner: { select: { firstName: true, lastName: true, companyName: true } },
        items: true,
      },
    }),
    db.conversation.findMany({
      take: 5,
      orderBy: { lastMessageAt: "desc" },
      include: {
        partner: { select: { firstName: true, lastName: true, companyName: true } },
        messages: { take: 1, orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  return (
    <AdminDashboard
      kpis={{
        totalPartners,
        activePartners,
        pendingOrders,
        unreadMessages: unreadConversations,
        totalDocuments,
      }}
      recentOrders={JSON.parse(JSON.stringify(recentOrders))}
      recentConversations={JSON.parse(JSON.stringify(recentConversations))}
    />
  );
}
