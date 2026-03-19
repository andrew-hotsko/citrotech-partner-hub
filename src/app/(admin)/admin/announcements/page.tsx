import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";

export default async function AdminAnnouncementsPage() {
  await requireAdmin();

  const announcements = await db.announcement.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return <AnnouncementsManager announcements={JSON.parse(JSON.stringify(announcements))} />;
}
