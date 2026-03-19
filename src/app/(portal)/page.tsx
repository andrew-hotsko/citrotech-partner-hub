import { requirePartner } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const partner = await requirePartner();

  const [recentOrders, recentAnnouncements, unreadCount] = await Promise.all([
    db.order.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: true },
    }),
    db.announcement.findMany({
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
    db.message.count({
      where: {
        conversation: { partnerId: partner.id },
        senderType: "ADMIN",
        isReadByPartner: false,
      },
    }),
  ]);

  return (
    <DashboardContent
      partner={{
        id: partner.id,
        firstName: partner.firstName,
        lastName: partner.lastName,
        companyName: partner.companyName,
        tier: partner.tier,
        certExpiresAt: partner.certExpiresAt
          ? partner.certExpiresAt.toISOString()
          : null,
      }}
      recentOrders={recentOrders.map((order: typeof recentOrders[number]) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        projectName: order.projectName,
        createdAt: order.createdAt.toISOString(),
      }))}
      recentAnnouncements={recentAnnouncements.map((a: typeof recentAnnouncements[number]) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        publishedAt: a.publishedAt.toISOString(),
      }))}
      unreadMessageCount={unreadCount}
    />
  );
}
