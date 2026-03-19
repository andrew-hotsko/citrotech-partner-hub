import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { MessagesManager } from "@/components/admin/messages-manager";

export default async function AdminMessagesPage() {
  await requireAdmin();

  const conversations = await db.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      partner: { select: { firstName: true, lastName: true, companyName: true, email: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          messages: {
            where: {
              senderType: "PARTNER",
              isReadByAdmin: false,
            },
          },
        },
      },
    },
  });

  return <MessagesManager conversations={JSON.parse(JSON.stringify(conversations))} />;
}
