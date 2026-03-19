import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PartnerDetail } from "@/components/admin/partner-detail";

interface PartnerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  const partner = await db.partner.findUnique({
    where: { id },
    include: {
      orders: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      conversations: {
        take: 10,
        orderBy: { lastMessageAt: "desc" },
        include: {
          messages: { take: 1, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!partner) {
    notFound();
  }

  return <PartnerDetail partner={JSON.parse(JSON.stringify(partner))} />;
}
