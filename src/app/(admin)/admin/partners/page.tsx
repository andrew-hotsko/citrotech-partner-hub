import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PartnersList } from "@/components/admin/partners-list";

export default async function AdminPartnersPage() {
  await requireAdmin();

  const partners = await db.partner.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { orders: true } },
    },
  });

  return <PartnersList partners={JSON.parse(JSON.stringify(partners))} />;
}
