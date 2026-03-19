import { requirePartner } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnouncementsFeed } from "@/components/announcements/announcements-feed";

export default async function AnnouncementsPage() {
  await requirePartner();

  const announcements = await db.announcement.findMany({
    where: {
      publishedAt: { lte: new Date() },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: [
      { isPinned: "desc" },
      { publishedAt: "desc" },
    ],
  });

  return (
    <AnnouncementsFeed
      announcements={announcements.map((a: typeof announcements[number]) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        type: a.type,
        isPinned: a.isPinned,
        authorName: a.authorName,
        publishedAt: a.publishedAt.toISOString(),
      }))}
    />
  );
}
